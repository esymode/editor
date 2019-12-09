import { Result, bind, Ok, Err, map } from "./functionalNonsense";

export type NormalizedPath = { readonly __tag: unique symbol };
export const unwrapNormalizedPath = (p: NormalizedPath): string => p as any;

export const normalizePath = (path: string): Result<NormalizedPath, string> => {
  // Note: ''.split('/') => [''].
  // Special case here because we reject empty path segments in the general case.
  if (path === "") {
    const ret: string = "";
    return Ok(ret as any);
  }
  const parts = path.split("/");
  const normalizedParts = parts.reduce<Result<string[], string>>(
    (output: Result<string[], string>, next: string) =>
      bind(output, prev => {
        switch (next) {
          case "":
            return Err(`Path "${path}" has an empty segment`);
          case ".":
            return output;
          case "..": {
            if (prev.length > 0 && prev[prev.length - 1] != "..") {
              return Ok(prev.slice(0, prev.length - 1));
            }
            return Ok(prev.concat(next));
          }
          default:
            return Ok(prev.concat(next));
        }
      }),
    Ok([])
  );

  return map<string[], string, string>(normalizedParts, parts =>
    parts.join("/")
  ) as any;
};

export const dirname = (
  path: NormalizedPath
): Result<NormalizedPath, string> => {
  const rawPath: string = path as any;
  if (rawPath.length === 0) {
    return Err("Cannot take dirname of empty path");
  }
  const lastSlash = rawPath.lastIndexOf("/");
  const rawDirname = lastSlash === -1 ? "" : rawPath.substring(0, lastSlash);
  return normalizePath(rawDirname);
};

export const join = (
  a: NormalizedPath,
  b: NormalizedPath
): Result<NormalizedPath, string> => {
  const rawA: string = a as any;
  if (rawA.length === 0) {
    return Ok(b);
  }

  const rawB: string = b as any;
  if (rawB.length === 0) {
    return Err("Second argument to join was empty");
  }

  return normalizePath(`${rawA}/${rawB}`);
};
