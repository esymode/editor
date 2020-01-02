import { U32, Str } from "ts-binary-types";
import { workerRpcClient, workerRpcImpl } from "./rpc_webworker";
import { defineProtocol } from "./rpc_definition";

const Workspace = Str;

const syncProtocol = defineProtocol({
  getVersion: { returns: U32 },
  saveWorkspace: { arg: Workspace }
});

const port = 100500;

// main thread
const worker: Worker = null as any;
const client = workerRpcClient(syncProtocol, worker, port);

client.getVersion().then(version => console.log(version));
client.saveWorkspace("content").then(() => console.log("saved"));

// worker
workerRpcImpl(
  syncProtocol,
  {
    getVersion: () => 444,
    saveWorkspace: workspase => {
      console.log(workspase);
      return Promise.resolve();
    }
  },
  worker, // actually in worker context this is 'self'
  port
);
