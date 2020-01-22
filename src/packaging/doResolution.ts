import { ExplicitDeps, DepsLock, SemVerRange, Version } from "src/workspace";
import {
  Result,
  Ok,
  Err,
  chainErrors,
  allResult,
  map,
  unsafeUnwrap
} from "src/functionalNonsense";
import {
  StartOfResolution,
  PackageJSON,
  versionedPackage,
  lockFromExplicitDeps,
  ResolutionReadyToResume
} from "./packageResolution";
import { normalizePath } from "src/normalizedPath";
import { fetchFileFromUnpkg } from "./bundling";

const assertNotNull = <T>(t: T | undefined | null): T => {
  if (t === null || t === undefined) {
    throw new Error("assertNotNull");
  }
  return t;
};

export const doPackageResolution = async (
  deps: ExplicitDeps
): Promise<Result<DepsLock, string>> => {
  const input: StartOfResolution = { stage: "start", deps };

  const cache = new Map<string, PackageJSON>();

  let res = lockFromExplicitDeps(input);

  while (res.stage !== "done-success" && res.stage !== "done-error") {
    const results = allResult(
      await Promise.all(
        res.resolveSemverRequests.map(
          async ({ name, semver }) =>
            await findMatchingVersionForSemverRange(name, semver).then(r =>
              r.tag === "Ok" ? Ok([{ name, semver }, r.val] as const) : r
            )
        )
      )
    );

    if (results.tag !== "Ok") {
      return results;
    }

    results.val.forEach(([{ name }, [version, pkgJson]]) => {
      cache.set(versionedPackage(name, version), pkgJson);
    });

    const forResume: ResolutionReadyToResume = {
      stage: "ready-to-resume",
      resolvedSemVerRequests: results.val.map(([req, [version]]) => [
        req,
        version
      ]),
      fetchedPackageJsonRequests: res.fetchPackageJsonRequests.map(
        ({ name, version }) => {
          const pkgJson = cache.get(versionedPackage(name, version));
          return [{ name, version }, assertNotNull(pkgJson)];
        }
      ),
      state: res.state
    };

    res = lockFromExplicitDeps(forResume);
  }

  if (res.stage === "done-success") {
    return Ok(res.lock);
  } else {
    return Err(res.err);
  }
};

const findMatchingVersionForSemverRange = async (
  name: string,
  semver: SemVerRange
): Promise<Result<[Version, PackageJSON], string>> => {
  // watch what we get redirected too
  const semverUrl = `https://unpkg.com/${name}@${semver}/package.json`;
  const unpkgRequest = await fetch(semverUrl)
    .then(response => response.json().then(pkg => Ok([response, pkg])))
    .catch(e => Err(`fetch("${semverUrl}") failed: ${e}`));

  if (unpkgRequest.tag === "Err") {
    return chainErrors(unpkgRequest, `Could not resolve ${name}@${semver}`);
  }

  const finalURL = unpkgRequest.val[0].url;
  // TODO validate this
  const packageJson: PackageJSON = unpkgRequest.val[1];

  const versionRegex = new RegExp(`https://unpkg.com/${name}@([0-9.]+)\/.*`);
  const groups = versionRegex.exec(finalURL);
  if (!groups) {
    return Err(`Could not parse version from ${finalURL}`);
  }
  const rawVersion = groups[1];
  //   const version = validateVersion(rawVersion);
  const version = rawVersion;
  //   if (!version.ok) {
  //     return chainErrors(version, `Invalid version for ${name}`);
  //   }
  // TODO: This should really put the package.json into cache.
  return Ok([version, packageJson]);
};

// const fetchFileFromUnpkg = (
//   serializeFile,
//   (file: NPMFile): Promise<Result<string>> => {
//     const path = unwrapNormalizedPath(file.path);
//     const url =
//       path.length > 0
//         ? `https://unpkg.com/${file.name}@${file.version}/${file.path}`
//         : `https://unpkg.com/${file.name}@${file.version}`;

//     return fetch(url, {
//       // Don't let unpkg redirect us
//       redirect: "error"
//     })
//       .then<Result<string>>(r =>
//         // only pass through body if status was 200 (unpkg returns a body on 404 too).
//         r.ok
//           ? r.text().then(ok)
//           : Promise.resolve(
//               err(`Fetch ${url} failed: status code ${r.statusText}`)
//             )
//       )
//       .catch((e: any) => err(`Fetch ${url} failed: ${e}`));
//   }
// );

export const fetchPackageJsons = (
  lock: DepsLock
): Promise<Result<Map<string, PackageJSON>, string>> =>
  Promise.all(
    Object.entries(lock).map(
      async ([specifier, version]): Promise<
        Result<[string, PackageJSON], string>
      > => {
        const name = specifier.substring(0, specifier.indexOf("@"));
        return await fetchFileFromUnpkg({
          type: "node_module",
          name,
          version,
          path: unsafeUnwrap(normalizePath("package.json"))
        }).then(result =>
          map(result, s => [`${name}@${version}`, JSON.parse(s)])
        );
      }
    )
  )
    .then(allResult)
    .then(pairs => map(pairs, ps => new Map(ps)));
