import {
  Str,
  Struct,
  Vec,
  Static,
  I32,
  Tuple,
  Bool,
  Nullable
} from "ts-binary-types";

import { defineProtocol } from "./rpc/rpc_definition";

const FileItem = Struct({
  name: Str
});
export type FileItem = Static<typeof FileItem>;

const FolderItem = Struct({
  name: Str,
  children: Vec(I32)
});

export type FolderItem = Static<typeof FolderItem>;

const ProjectId = Str;

const PackageJsonData = Struct({
  main: Nullable(Str),
  module: Nullable(Str),
  es2015: Nullable(Str),
  dependencies: Nullable(Vec(Tuple(Str, Str))),
  peerDependencies: Nullable(Vec(Tuple(Str, Str)))
});
export type PackageJsonData = Static<typeof PackageJsonData>;

const ProjectData = Struct({
  name: Str,
  nextId: I32,
  rootId: I32,
  files: Vec(Tuple(I32, FileItem)),
  sources: Vec(Tuple(I32, Str)),
  folders: Vec(Tuple(I32, FolderItem)),
  explicitDeps: Vec(Tuple(Str, Str)),
  depsLock: Vec(Tuple(Str, Str)),
  savedPackageJsons: Vec(Tuple(Str, PackageJsonData))
});

export type ProjectData = Static<typeof ProjectData>;

const ProjectDesc = Struct({
  id: ProjectId,
  name: Str
});

export type ProjectDesc = Static<typeof ProjectDesc>;

export const clientServerAPI = defineProtocol({
  createProject: { arg: ProjectData, returns: ProjectDesc },
  loadProject: { arg: ProjectId, returns: Nullable(ProjectData) },
  saveProject: { arg: Tuple(ProjectId, ProjectData) },
  listProjects: { returns: Vec(ProjectDesc) },
  clearProjects: { returns: Bool }
});
