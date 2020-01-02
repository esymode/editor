import { Str, Struct, Vec, Static } from "ts-binary-types";
import { defineProtocol } from "./rpc/rpc_definition";

const ProjectDesc = Struct({
  id: Str,
  name: Str
});

export type ProjectDesc = Static<typeof ProjectDesc>;

export const clientServerAPI = defineProtocol({
  createProject: { arg: Str, returns: ProjectDesc },
  listProjects: { returns: Vec(ProjectDesc) }
});
