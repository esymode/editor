import {
  Str,
  Struct,
  Vec,
  Static,
  I32,
  Tuple,
  Optional
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

const ProjectData = Struct({
  nextId: I32,
  rootId: I32,
  files: Vec(Tuple(I32, FileItem)),
  sources: Vec(Tuple(I32, Str)),
  folders: Vec(Tuple(I32, FolderItem))
});
export type ProjectData = Static<typeof ProjectData>;

const ProjectDesc = Struct({
  id: Str,
  name: Str
});
export type ProjectDesc = Static<typeof ProjectDesc>;

export const clientServerAPI = defineProtocol({
  createProject: { arg: Str, returns: ProjectDesc },
  loadProject: { arg: Str, returns: Optional(ProjectData) },
  listProjects: { returns: Vec(ProjectDesc) }
});
