import { PackageJSON, versionedPackage } from "./packageResolution";
import {
  chainErrors,
  match,
  Err,
  Ok,
  Result,
  unsafeUnwrap,
  bind,
  allResult,
  asyncMap
} from "src/functionalNonsense";
import {
  normalizePath,
  unwrapNormalizedPath,
  NormalizedPath,
  join,
  dirname
} from "src/normalizedPath";
import { Version, DepsLock, ExplicitDeps, SemVerRange } from "src/workspace";

const joinFile = (file: File, name: NormalizedPath): Result<File, string> =>
  match<NormalizedPath, Result<File, string>, string>(join(file.path, name), {
    Ok: path => Ok({ ...file, path }),
    Err: e => chainErrors(Err(e), "Could not append path to file")
  });

const dirnameFile = (file: File): Result<File, string> =>
  match<NormalizedPath, Result<File, string>, string>(dirname(file.path), {
    Ok: path => Ok({ ...file, path }),
    Err: e => chainErrors(Err(e), "Could not take dirname of file")
  });

export const appendPathPart = (
  path: NormalizedPath,
  addition: string
): Result<NormalizedPath, string> =>
  normalizePath(((path as any) as string) + addition);

const appendFileNamePart = (file: File, part: string): Result<File, string> =>
  match<NormalizedPath, Result<File, string>, string>(
    appendPathPart(file.path, part),
    {
      Ok: path => Ok({ ...file, path }),
      Err: e => chainErrors(Err(e), "Coudl not append part to file")
    }
  );

type FetchContents = (_: File) => Promise<Result<string, string>>;

// https://nodejs.org/api/modules.html
const resolutionPathGuesses: (
  request: File,
  packageJsons: Map<string, PackageJSON>
) => Result<File[], string> = (request, packageJsons) => {
  const loadFile: (request: File) => Result<File[], string> = request =>
    allResult(
      ["", ".js", ".json"].map(ext => appendFileNamePart(request, ext))
    );

  const loadIndex: (request: File) => Result<File[], string> = request =>
    allResult(
      ["index.js", "index.json"].map(name =>
        joinFile(request, unsafeUnwrap(normalizePath(name)))
      )
    );

  const attempts = [];

  // This "if" is a hacky optimization to avoid requesting silly files like
  // react@16.11.0/.js when looking up the root file of a NPM module.
  if (
    request.type !== "node_module" ||
    unwrapNormalizedPath(request.path) !== ""
  ) {
    const asFileResult = loadFile(request);
    if (asFileResult.tag !== "Ok") {
      return asFileResult;
    }
    attempts.push(...asFileResult.val);
  }

  if (request.type === "node_module") {
    const package_json = packageJsons.get(
      versionedPackage(request.name, request.version)
    );
    if (package_json) {
      const { main, module, es2015 } = package_json;
      const rawMainField = module || es2015 || main;
      const mainField = rawMainField && normalizePath(rawMainField);
      if (mainField) {
        if (mainField.tag !== "Ok") {
          return chainErrors(
            mainField,
            `In package ${serializeFile(
              request
            )}, main field "${rawMainField}" could not be parsed`
          );
        }
        const nextReq =
          unwrapNormalizedPath(request.path).length === 0
            ? joinFile(request, mainField.val)
            : joinFile(
                {
                  ...request,
                  path: unsafeUnwrap(dirname(mainField.val))
                },
                request.path
              );
        if (nextReq.tag !== "Ok") {
          return chainErrors(
            nextReq,
            `main field "${mainField.val}" could not be joined to base path ${serializeFile}`
          );
        }
        const asFileResult = loadFile(nextReq.val);
        if (asFileResult.tag !== "Ok") {
          return chainErrors(
            asFileResult,
            `Failed to resolve ${serializeFile(request)}`
          );
        }
        attempts.push(...asFileResult.val);

        const asIndexResult = loadIndex(nextReq.val);
        if (asIndexResult.tag !== "Ok") {
          return chainErrors(
            asIndexResult,
            `Failed to resolve ${serializeFile(request)}`
          );
        }
        attempts.push(...asIndexResult.val);
      }
    }
  }

  const asIndexResult = loadIndex(request);
  if (asIndexResult.tag !== "Ok") {
    return asIndexResult;
  }
  attempts.push(...asIndexResult.val);
  return Ok(attempts);
};

export const resolveVirtualPath = (
  getContents: FetchContents,
  lock: DepsLock,
  packageJsons: Map<string, PackageJSON>,
  explicitDeps: ExplicitDeps
) => async (
  id: NormalizedPath,
  relative: boolean,
  importer: File | undefined
): Promise<Result<File | null, string>> => {
  const guesses = await resolveVirtualPathGuesses(
    id,
    relative,
    importer,
    lock,
    packageJsons,
    explicitDeps
  );

  return asyncMap(guesses, async guesses => {
    for (const guess of guesses) {
      const contents = await getContents(guess);
      if (contents.tag === "Ok") {
        return guess;
      }
    }
    return null;
  });
};

const resolveVirtualPathGuesses = async (
  id: NormalizedPath,
  relative: boolean,
  importer: File | undefined,
  lock: DepsLock,
  packageJsons: Map<string, PackageJSON>,
  explicitDeps: ExplicitDeps
): Promise<Result<File[], string>> => {
  // entry point
  if (importer === undefined) {
    return resolutionPathGuesses({ type: "local", path: id }, packageJsons);
  }

  // relative/local import
  if (relative) {
    const req = joinFile(unsafeUnwrap(dirnameFile(importer)), id);
    if (req.tag !== "Ok") {
      return chainErrors(
        req,
        `Could not construct import path when importing ${id} from ${
          importer !== undefined ? serializeFile(importer) : "undefined"
        }`
      );
    }
    return resolutionPathGuesses(req.val, packageJsons);
  }

  // non local import

  // Handle stuff like babel/foo
  // This seems hacktastic and probably won't work for everything; in
  // particular, an import of a sub-path from a package with a slash in the name
  // would break; first/last/path would be parsed as first -> last/path, instead
  // of first/last -> path.
  const upath = unwrapNormalizedPath(id);
  const first = upath.indexOf("/");
  const [name, path] =
    first === -1
      ? [upath, ""]
      : [upath.substring(0, first), upath.substring(first + 1)];

  const semverRange = semverRangeForImport(
    name,
    importer,
    packageJsons,
    explicitDeps
  );

  if (semverRange.tag !== "Ok") {
    return chainErrors(semverRange, `Could not resolve ${id}`);
  }

  // now that we have the semver range, we can finally look up the version
  const version = lock[semverRange.val]
    ? Ok(lock[semverRange.val])
    : Err(`lock does not have an entry for ${semverRange.val}`);

  if (version.tag !== "Ok") {
    return version;
  }

  // Finally, we know the exact name, version, and path to look up...
  // ... but we still need to do resolution to handle index.js, etc.
  return resolutionPathGuesses(
    {
      type: "node_module",
      name,
      version: version.val,
      path: unsafeUnwrap(normalizePath(path))
    },
    packageJsons
  );
};

// Map a package name to the semver range that constraints it (for this import).
const semverRangeForImport = (
  target: string,
  importer: File,
  packageJsons: Map<string, PackageJSON>,
  explicitDeps: DepsLock
): Result<SemVerRange, string> => {
  if (importer.type === "node_module") {
    // where is the import from?
    const importerSpecifier = versionedPackage(importer.name, importer.version);

    // what is the package.json for where the import is from?
    const pkg = packageJsons.get(importerSpecifier);
    if (!pkg) {
      return Err(
        `packageJsons does not have an entry for ${importerSpecifier}`
      );
    }

    if (!pkg.dependencies && !pkg.peerDependencies) {
      return Err(
        `packageJsons.get(${importerSpecifier}) does not have a dependency or peer dependency array, but imports ${target}`
      );
    }

    // what does this package mean to import?
    const semver =
      (pkg.dependencies && pkg.dependencies[target]) ||
      (pkg.peerDependencies && pkg.peerDependencies[target]);
    if (!semver) {
      return Err(
        `package ${importerSpecifier} does not list ${target} as a dependency or peer dependency`
      );
    }

    return Ok(semver);
  } else {
    const semver = explicitDeps[target];
    if (!semver) {
      return Err(`ExplicitDeps does not have an entry for ${target}`);
    }

    return Ok(semver);
  }
};

export type LocalFile = {
  type: "local";
  path: NormalizedPath;
};

export type NPMFile = {
  type: "node_module";
  name: string;
  version: Version;
  path: NormalizedPath;
};

export type File = LocalFile | NPMFile;
export const serializeFile = (file: File): string => {
  switch (file.type) {
    case "local":
      return `###${unwrapNormalizedPath(file.path)}`;
    case "node_module": {
      const path = unwrapNormalizedPath(file.path);
      return `###node_modules/${file.name}#${file.version}#${path}`;
    }
  }
};
export const deserializeFile = (s: string): Result<File, string> => {
  if (!s.startsWith("###")) {
    return Err("Not a serialized file");
  }

  if (s.startsWith("###node_modules/")) {
    const match = new RegExp(
      "^###node_modules/(.*)#([0-9]+[.][0-9]+[.][0-9]+)#(.+)$"
    ).exec(s);
    if (!match) {
      return Err(`Serialized file "${s}" is invalid.`);
    }

    const [, name, versionString, pathString] = match;
    const version = versionString;
    //if (!version.ok) {
    //  return chainErrors(
    //    version,
    //    `Serialized file "${s}" has invalid version "${versionString}"`
    //  );
    //}

    const path = normalizePath(pathString);
    if (path.tag !== "Ok") {
      return chainErrors(
        path,
        `Serialized file "${s}" has invalid path "${pathString}"`
      );
    }
    return Ok({
      type: "node_module",
      name,
      version: version,
      path: path.val
    });
  } else {
    const local = s.substring(3);
    return bind(normalizePath(local), path => Ok({ type: "local", path }));
  }
};
