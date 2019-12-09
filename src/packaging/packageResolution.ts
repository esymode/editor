import { DepsLock, SemVerRange, ExplicitDeps, Version } from "../workspace";
import * as maxSatisfying from "semver/ranges/max-satisfying";
import { Err, Ok, allResult } from "../functionalNonsense";

export type PackageJSON = {
  es2015?: string;
  module?: string;
  main?: string;
  dependencies?: {
    [name: string]: SemVerRange;
  };
  peerDependencies?: {
    [name: string]: SemVerRange;
  };
};

// Translate this (name, semver range) into a specific version
export type ResolveSemverRequest = {
  name: string; // "react"
  semver: SemVerRange; // ^16.11.0
};

// Fetch package.json for this (name, version)
export type FetchPackageJsonRequest = {
  name: string; //
  version: Version;
};

type PackageResolutionState = { readonly __tag: unique symbol };

export type StartOfResolution = {
  stage: "start";
  deps: ExplicitDeps;
};
export type ResolutionPausedForIO = {
  stage: "paused-for-io";
  resolveSemverRequests: ResolveSemverRequest[];
  fetchPackageJsonRequests: FetchPackageJsonRequest[];
  state: PackageResolutionState;
};
export type ResolutionReadyToResume = {
  stage: "ready-to-resume";
  resolvedSemVerRequests: [ResolveSemverRequest, Version][];
  fetchedPackageJsonRequests: [FetchPackageJsonRequest, PackageJSON][];
  state: PackageResolutionState;
};
export type ResolutionSuccess = {
  stage: "done-success";
  lock: DepsLock;
};

export type ResolutionFailed = {
  stage: "done-error";
  err: string;
};

const reqSemverId = ({ name, semver }: ResolveSemverRequest) =>
  `semver-${versionedPackage(name, semver)}`;

const reqPackageJSONId = ({ name, version }: FetchPackageJsonRequest) =>
  `package-${versionedPackage(name, version)}`;

const dedupe = <T>(xs: T[], key: (_: T) => string): T[] =>
  Array.from(xs.reduce((m, x) => m.set(key(x), x), new Map()).values());

/*
 1. for each name-semver, request resolution if not in map
 2. for each name-version, add to map (assert not present).
 3. for each name-version, request packagejson. add to set
 4. for each packagejson, go to 1.
 */

export const lockFromExplicitDeps = (
  step: StartOfResolution | ResolutionReadyToResume
): ResolutionPausedForIO | ResolutionSuccess | ResolutionFailed => {
  type RealStateType = {
    // {"react@16.11.0", "scheduler@1.4.0"}
    packageJsonFetchDone: Set<string>;
    pendingIo: Set<string>;
    peerDepsSemVerRanges: Set<[string, SemVerRange]>;
    partialDepsLock: DepsLock;
  };

  if (step.stage === "start") {
    // First, fetch version list for every package we have.
    const initialSemverRequests = Object.entries(
      step.deps
    ).map(([name, semver]) => ({ name, semver }));

    const state: RealStateType = {
      packageJsonFetchDone: new Set(),
      pendingIo: new Set(initialSemverRequests.map(reqSemverId)),
      peerDepsSemVerRanges: new Set(),
      partialDepsLock: {}
    };
    return {
      stage: "paused-for-io",
      resolveSemverRequests: initialSemverRequests,
      fetchPackageJsonRequests: [],
      state: (state as unknown) as PackageResolutionState
    };
  }

  const internalState = (step.state as unknown) as RealStateType;

  const newPackagesToFetch: FetchPackageJsonRequest[] = dedupe(
    step.resolvedSemVerRequests
      .filter(
        ([{ name }, version]) =>
          !internalState.packageJsonFetchDone.has(
            versionedPackage(name, version)
          ) && !internalState.pendingIo.has(reqPackageJSONId({ name, version }))
      )
      .map(([{ name }, version]) => ({ name, version })),
    ({ name, version }) => `${name}@${version}`
  );

  const newSemverRangesToResolve: ResolveSemverRequest[] = dedupe(
    ([] as [string, SemVerRange][])
      .concat(
        ...step.fetchedPackageJsonRequests.map(([, { dependencies = {} }]) =>
          Object.entries(dependencies)
        )
      )
      .filter(
        ([name, semver]) =>
          internalState.partialDepsLock[versionedPackage(name, semver)] ===
            undefined &&
          !internalState.pendingIo.has(reqSemverId({ name, semver }))
      )
      .map(([name, semver]) => ({ name, semver })),
    ({ name, semver }) => `${name}@${semver}`
  );

  const newPeerDeps = ([] as [string, SemVerRange][]).concat(
    ...step.fetchedPackageJsonRequests.map(([, { peerDependencies = {} }]) =>
      Object.entries(peerDependencies)
    )
  );
  newPeerDeps.forEach(dep => internalState.peerDepsSemVerRanges.add(dep));

  step.resolvedSemVerRequests.forEach(([req]) =>
    internalState.pendingIo.delete(reqSemverId(req))
  );

  step.fetchedPackageJsonRequests.forEach(([req]) =>
    internalState.pendingIo.delete(reqPackageJSONId(req))
  );

  newSemverRangesToResolve.forEach(req =>
    internalState.pendingIo.add(reqSemverId(req))
  );

  newPackagesToFetch.forEach(req =>
    internalState.pendingIo.add(reqPackageJSONId(req))
  );

  newPackagesToFetch.forEach(({ name, version }) => {
    internalState.packageJsonFetchDone.add(`${name}@${version}`);
  });

  const lockUpdateDoneRequests = step.resolvedSemVerRequests.reduce(
    (lock, [{ name, semver }, version]) => {
      lock[`${name}@${semver}`] = version;
      return lock;
    },
    {} as DepsLock
  );

  if (internalState.pendingIo.size === 0) {
    const peerDepResolutions = Array.from(
      internalState.peerDepsSemVerRanges.values()
    ).map(([name, semverRange]) => {
      const resolvedVersions = Object.entries(internalState.partialDepsLock)
        .filter(([nameAndSemVer]) => nameAndSemVer.startsWith(name))
        .map(([, version]) => version);

      const result = maxSatisfying(resolvedVersions, semverRange);

      return result
        ? Ok([versionedPackage(name, semverRange), result] as const)
        : Err(
            `Could not match peerDep ${name}@${semverRange}; resolved versions were ${JSON.stringify(
              resolvedVersions
            )}`
          );
    });

    const peerDeps = allResult(peerDepResolutions);
    if (peerDeps.tag !== "Ok") {
      return { stage: "done-error", err: peerDeps.err };
    } else {
      return {
        stage: "done-success",
        lock: {
          ...internalState.partialDepsLock,
          ...Object.fromEntries(peerDeps.val)
        }
      };
    }
  }

  const newInternalState: RealStateType = {
    partialDepsLock: {
      ...internalState.partialDepsLock,
      ...lockUpdateDoneRequests
    },
    pendingIo: internalState.pendingIo,
    peerDepsSemVerRanges: internalState.peerDepsSemVerRanges,
    packageJsonFetchDone: internalState.packageJsonFetchDone
  };
  return {
    stage: "paused-for-io",
    resolveSemverRequests: newSemverRangesToResolve,
    fetchPackageJsonRequests: newPackagesToFetch,
    state: (newInternalState as unknown) as PackageResolutionState
  };
};

export const versionedPackage = (name: string, semver: string) =>
  `${name}@${semver}`;
