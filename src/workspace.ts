type FileEntry = {
  tag: "file";
  content: string;
};

type FolderEntry = {
  tag: "folder";
  children: { [name: string]: FolderEntry | FileEntry };
};

export type SemVer = string; // TODO
export type Version = string; // TODO

export type DepsLock = {
  [nameAndSemver: string]: Version;
};

export type ExplicitDeps = {
  [packageName: string]: SemVer;
};

export type Workspace = {
  // 1
  version: number;

  // index.ts -> content
  files: FolderEntry;

  // react: "^16.9.0"
  explicitDeps: ExplicitDeps;

  // "react@^16.9.0": { name: "react", "version": "16.11.0" }
  depsLock: DepsLock;
};
