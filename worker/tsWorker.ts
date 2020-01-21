import {
  tsAPI,
  CompileResult,
  TS_API_PORT
} from "../shared/typescript_worker_api";
import { workerRpcImpl } from "../shared/rpc/rpc_webworker";
import { compile } from "./transpilation";

workerRpcImpl(
  tsAPI,
  {
    compile: ({files, entry}) => {
      const result = compile(files, entry);
      return result.tag === "Ok"
        ? CompileResult.Ok(result.val)
        : CompileResult.Err(result.err);
    }
  },
  self,
  TS_API_PORT
);
