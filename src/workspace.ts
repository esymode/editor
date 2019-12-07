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
// Represents a [name, version]
type EncodedNameAndVersion = string;

type DepsLock = {
  // react: 16.11.0
  explicit: { [name: string]: Version };
  // { "react@16.11.0": ["scheduler", "1.2.3"] }
  thirdParty: { [source: string]: /*EncodedNameAndVersion*/ [string, Version] };
};

type Workspace = {
  // index.ts -> content
  files: FolderEntry;

  // react: "^16.9.0"
  explicitDeps: { [packageName: string]: SemVer };

  depsLock: DepsLock;
};
