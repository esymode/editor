import { Vec, Str, Union, Struct } from "ts-binary-types";
import { defineProtocol } from "./rpc/rpc_definition";

export const CompileRequest = Struct({
  files: Vec(
    Struct({
      name: Str,
      content: Str
    })
  ),
  entry: Str
});
export const CompileResult = Union({
  Ok: Vec(Struct({ name: Str, content: Str })),
  Err: Str
});

export const TS_API_PORT = 100600;

export const tsAPI = defineProtocol({
  compile: { arg: CompileRequest, returns: CompileResult }
});
