import commonjs from "rollup-plugin-commonjs-fork";
import {
  resolveVirtualPath,
  deserializeFile,
  serializeFile,
  NPMFile,
  LocalFile,
  File
} from "./virtual-file-system";
import {
  SourceDescription,
  Plugin,
  RollupOptions,
  rollup
} from "rollup/dist/rollup.browser.es";
import {
  match,
  unsafeUnwrap,
  Result,
  Ok,
  Err,
  chainErrors
} from "src/functionalNonsense";
import { normalizePath, unwrapNormalizedPath } from "src/normalizedPath";
import { ExplicitDeps, DepsLock } from "src/workspace";
import { PackageJSON } from "./packageResolution";

export const fetchFileFromUnpkg = (
  file: NPMFile
): Promise<Result<string, string>> => {
  const path = unwrapNormalizedPath(file.path);
  const url =
    path.length > 0
      ? `https://unpkg.com/${file.name}@${file.version}/${file.path}`
      : `https://unpkg.com/${file.name}@${file.version}`;

  return fetch(url, {
    // Don't let unpkg redirect us
    redirect: "error"
  })
    .then<Result<string, string>>(r =>
      // only pass through body if status was 200 (unpkg returns a body on 404 too).
      r.ok
        ? r.text().then(Ok)
        : Promise.resolve(
            Err(`Fetch ${url} failed: status code ${r.statusText}`)
          )
    )
    .catch((e: any) => Err(`Fetch ${url} failed: ${e}`));
};

const VirtualFilesPlugin: (
  files: { name: string; content: string }[],
  lock: DepsLock,
  packageJsons: Map<string, PackageJSON>,
  explicitDeps: ExplicitDeps
) => Plugin = (files, lock, packageJsons, explicitDeps) => {
  const fetchFileFromLocal = (file: LocalFile): Result<string, string> => {
    const localFile = files.filter(
      ({ name }) => unsafeUnwrap(normalizePath(name)) === file.path
    )[0];
    if (localFile) {
      return Ok(localFile.content);
    } else {
      return Err(`Could not find local file ${file.path}`);
    }
  };

  // Note this is a composition of fetchFileFromLocal (constructed per rollup run) and fetchFileFromUnpkg (global/cached).
  const getContents = async (req: File): Promise<Result<string, string>> => {
    return match<string, Result<string, string>, string>(
      req.type === "local"
        ? await fetchFileFromLocal(req)
        : await fetchFileFromUnpkg(req),
      {
        Ok: v => Ok(v),
        Err: e =>
          chainErrors(Err(e), `getContents ${JSON.stringify(req)} failed`)
      }
    );
  };

  const resolvePath = resolveVirtualPath(getContents, lock, packageJsons);

  return {
    name: "virtual-files-plugin",
    async resolveId(id: string, sourceOfImport?: string) {
      // CJS plugin produces these
      if (id.startsWith("\0")) {
        return null;
      }

      // CJS may also cause this plugin to be called multiple times on the same
      // file, so if we have already resolved a file don't try again.
      const idAsFile = deserializeFile(id);
      if (idAsFile.tag === "Ok") {
        return id;
      }

      const importerFile =
        sourceOfImport !== undefined
          ? match<File, Result<File | undefined, string>, string>(
              deserializeFile(sourceOfImport),
              {
                Ok: file => Ok(file),
                Err: e =>
                  chainErrors(
                    Err(e),
                    `Could not understand previously resolved file ${sourceOfImport}`
                  )
              }
            )
          : Ok(undefined);

      if (importerFile.tag !== "Ok") {
        console.error(`resolveId failed: ${importerFile.err}`);
        return null;
      }

      return match(
        await resolvePath(
          unsafeUnwrap(normalizePath(id)),
          id.startsWith("."),
          importerFile.val,
          explicitDeps
        ),
        {
          Ok: val => (val ? serializeFile(val) : null),
          Err: err => {
            console.error(`Could not resolve for ${id}: ${err}`);
            return null;
          }
        }
      );
    },

    async load(request: string): Promise<SourceDescription | string | null> {
      // CJS plugin produces these
      if (request.startsWith("\0")) {
        return null;
      }

      const requestedFile = deserializeFile(request);
      if (requestedFile.tag === "Err") {
        console.error(`Could not load(${request}) due to ${requestedFile.err}`);
        return null;
      }

      const contents = await getContents(requestedFile.val);
      if (contents.tag === "Err") {
        console.error(`Could not load(${request}) due to ${contents.err}`);
        return null;
      }

      return contents.val;
    }
  };
};

export const toRollupShit = (
  files: { name: string; content: string }[],
  lock: DepsLock,
  entry: string,
  packageJsons: Map<string, PackageJSON>,
  explicitDeps: ExplicitDeps
): RollupOptions => {
  return {
    input: entry,
    perf: true,
    treeshake: false,
    plugins: [
      ReplacePlugin({ "process\\.env\\.NODE_ENV": '"production"' }),
      VirtualFilesPlugin(files, lock, packageJsons, explicitDeps),
      commonjs({
        // non-CommonJS modules will be ignored, but you can also
        // specifically include/exclude files

        // if true then uses of `global` won't be dealt with by this plugin
        ignoreGlobal: false, // Default: false

        // if false then skip sourceMap generation for CommonJS modules
        sourceMap: false // Default: true
      })
    ]
  };
};

// not using rollup-plugin-replace because it pulls in transitive dependencies
// on path and some other packages.
const ReplacePlugin = (map: { [from: string]: string }): Plugin => ({
  name: "ReplacePlugin",
  transform(code: string): string {
    return Object.entries(map).reduce(
      (s, [from, to]) => s.replace(new RegExp(from, "g"), to),
      code
    );
  }
});

export const bundle = async (
  files: { name: string; content: string }[],
  entry: string,
  lock: DepsLock,
  packageJsons: Map<string, PackageJSON>,
  explicitDeps: ExplicitDeps
): Promise<Result<string, string>> => {
  const bundle = await rollup(
    toRollupShit(files, lock, entry, packageJsons, explicitDeps)
  );
  const { output } = await bundle.generate({ format: "esm" });

  for (const chunkOrAsset of output) {
    if (chunkOrAsset.type === "asset") {
      // For assets, this contains
      // {
      //   fileName: string,              // the asset file name
      //   source: string | Buffer        // the asset source
      //   type: 'asset'                  // signifies that this is an asset
      // }
    } else {
      // For chunks, this contains
      // {
      //   code: string,                  // the generated JS code
      //   dynamicImports: string[],      // external modules imported dynamically by the chunk
      //   exports: string[],             // exported variable names
      //   facadeModuleId: string | null, // the id of a module that this chunk corresponds to
      //   fileName: string,              // the chunk file name
      //   imports: string[],             // external modules imported statically by the chunk
      //   isDynamicEntry: boolean,       // is this chunk a dynamic entry point
      //   isEntry: boolean,              // is this chunk a static entry point
      //   map: string | null,            // sourcemaps if present
      //   modules: {                     // information about the modules in this chunk
      //     [id: string]: {
      //       renderedExports: string[]; // exported variable names that were included
      //       removedExports: string[];  // exported variable names that were removed
      //       renderedLength: number;    // the length of the remaining code in this module
      //       originalLength: number;    // the original length of the code in this module
      //     };
      //   },
      //   name: string                   // the name of this chunk as used in naming patterns
      //   type: 'chunk',                 // signifies that this is a chunk
      // }
      console.log("timings:", bundle.getTimings!());
      return Ok(chunkOrAsset.code);
    }
  }
  return Err("Bundling failed - no chunks");
};
