import { U32, Str } from "ts-binary-types";
import { defineProtocol } from "../shared/rpc/rpc_definition";

const Workspace = Str;

export const syncProtocol = defineProtocol({
  getVersion: { returns: U32 },
  saveWorkspace: { arg: Workspace }
});
