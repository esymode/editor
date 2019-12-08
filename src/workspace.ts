type FileEntry = {
  tag: "file";
  content: string;
};

type FolderEntry = {
  tag: "folder";
  children: { [name: string]: FolderEntry | FileEntry };
};

type SemVer = string; // TODO
type Version = string; // TODO
type Name = string; // TODO

type DepsLock = {
  [nameAndSemver: string]: {
    name: Name,
    version: Version
  }
};

type Workspace = {
  // 1
  version: number;
  
  // index.ts -> content
  files: FolderEntry;

  // react: "^16.9.0"
  explicitDeps: { [packageName: string]: SemVer };

  // "react@^16.9.0": { name: "react", "version": "16.11.0" }
  depsLock: DepsLock;
};
