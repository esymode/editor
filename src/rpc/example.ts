import { U32, Str } from "ts-binary-types";
import {
  workerRpcClient,
  workerRpcImpl as hostWorkerRpc
} from "./rpc_webworker";
import { ProtocolImpl } from "./rpc_definition";

const Workspace = Str;

const syncProtocol = {
  getVersion: { returns: U32 },
  saveWorkspace: { arg: Workspace }
} as const;

const port = 100500;

// main thread
const worker: Worker = null as any;
const client = workerRpcClient(syncProtocol, worker, port);

client.getVersion().then(version => console.log(version));

// worker
const impl: ProtocolImpl<typeof syncProtocol> = {
  getVersion: () => 444,
  saveWorkspace: workspase => {
    console.log(workspase);
    return Promise.resolve();
  }
};

hostWorkerRpc(impl, port);
