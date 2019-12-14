import { DepsLock, SemVer, ExplicitDeps, Version } from "./workspace";

export type PackageJSON = {
  dependencies: {
    [name: string]: SemVer;
  };
};

type ResolveSemverRequest = {
  name: string;
  semver: SemVer;
};

type FetchPackageJsonRequest = {
  name: string;
  version: Version;
};

type PartialDepsLock = {
  [nameAndSemver: string]: DepsLock[string] | "pending";
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
  fetchedPackageJsonRequests: PackageJSON[];
  state: PackageResolutionState;
};
export type ResolutionDone = {
  stage: "done";
  lock: DepsLock;
};

const invariant = (b: boolean, m?: string) => {
  if (!b) {
    throw new Error(`Invariant violated: ${m}`);
  }
};

/*
 1. for each name-semver, request resolution if not in map
 2. for each name-version, add to map (assert not present).
 3. for each name-version, request packagejson. add to set
 4. for each packagejson, go to 1.
 */

export const lockFromExplicitDeps = (
  step: StartOfResolution | ResolutionReadyToResume
): ResolutionPausedForIO | ResolutionDone => {
  type RealStateType = {
    packageJsonFetchIssued: Set<string>;
    partialDepsLock: PartialDepsLock;
  };

  if (step.stage === "start") {
    // First, fetch version list for every package we have.
    const state: RealStateType = {
      packageJsonFetchIssued: new Set(),
      partialDepsLock: Object.entries(step.deps).reduce(
        (state, [name, semver]) => {
          state[`${name}@${semver}`] = "pending";
          return state;
        },
        {} as PartialDepsLock
      )
    };
    return {
      stage: "paused-for-io",
      resolveSemverRequests: Object.entries(
        step.deps
      ).map(([name, semver]) => ({ name, semver })),
      fetchPackageJsonRequests: [],
      state: (state as unknown) as PackageResolutionState
    };
  }

  const internalState = (step.state as unknown) as RealStateType;

  const lockUpdateDoneRequests = step.resolvedSemVerRequests.reduce(
    (lock, [{ name, semver }, version]) => {
      // The request should have been marked as 'pending' when we started it.
      // It should not have been already completed.
      invariant(
        internalState.partialDepsLock[`${name}@${semver}`] === "pending",
        `Package ${name}@${semver} was resolved without being marked pending`
      );

      lock[`${name}@${semver}`] = version;
      return lock;
    },
    {} as PartialDepsLock
  );

  const newPackagesToFetch: FetchPackageJsonRequest[] = step.resolvedSemVerRequests
    .filter(
      ([{ name }, version]) =>
        !internalState.packageJsonFetchIssued.has(`${name}@${version}`)
    )
    .map(([{ name }, version]) => ({ name, version }));

  const newDepsToResolve: ResolveSemverRequest[] = ([] as [string, SemVer][])
    .concat(
      ...step.fetchedPackageJsonRequests.map(({ dependencies }) =>
        Object.entries(dependencies)
      )
    )
    .filter(
      ([name, semver]) =>
        internalState.partialDepsLock[`${name}@${semver}`] === undefined
    )
    .map(([name, semver]) => ({ name, semver }));

  const lockUpdatePendingRequests: PartialDepsLock = newDepsToResolve.reduce(
    (newState, { name, semver }) => {
      newState[`${name}@${semver}`] = "pending";
      return newState;
    },
    {} as PartialDepsLock
  );

  if (newPackagesToFetch.length === 0 && newDepsToResolve.length === 0) {
    const lock = Object.fromEntries(
      Object.entries(internalState.partialDepsLock).map(([key, value]): [
        string,
        DepsLock[string]
      ] => {
        if (value === "pending") {
          throw new Error("Unresolved request in deps lock");
        }
        return [key, value];
      })
    );
    return { stage: "done", lock };
  }

  const newInternalState: RealStateType = {
    partialDepsLock: {
      ...internalState.partialDepsLock,
      ...lockUpdatePendingRequests,
      ...lockUpdateDoneRequests
    },
    packageJsonFetchIssued: internalState.packageJsonFetchIssued
  };
  return {
    stage: "paused-for-io",
    resolveSemverRequests: newDepsToResolve,
    fetchPackageJsonRequests: newPackagesToFetch,
    state: (newInternalState as unknown) as PackageResolutionState
  };
};
