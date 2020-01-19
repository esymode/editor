import {
  Str,
  Struct,
  Vec,
  Static,
  I32,
  Tuple,
  Optional,
  Bool
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

const ProjectData = Struct({
  nextId: I32,
  rootId: I32,
  files: Vec(Tuple(I32, FileItem)),
  sources: Vec(Tuple(I32, Str)),
  folders: Vec(Tuple(I32, FolderItem))
});

export type ProjectData = Static<typeof ProjectData>;

const ProjectDesc = Struct({
  id: ProjectId,
  name: Str
});
export type ProjectDesc = Static<typeof ProjectDesc>;

export const clientServerAPI = defineProtocol({
  createProject: { arg: Tuple(Str, ProjectData), returns: ProjectDesc },
  loadProject: { arg: ProjectId, returns: Optional(ProjectData) },
  saveProject: { arg: Tuple(ProjectId, ProjectData) },
  listProjects: { returns: Vec(ProjectDesc) },
  clearProjects: { returns: Bool }
});
