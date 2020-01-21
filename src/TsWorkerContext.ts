import { createContext } from "react";

import { createProtocolClient } from "shared/rpc/rpc_http";
import { tsAPI } from "shared/typescript_worker_api";

const dummyClient = createProtocolClient(tsAPI, () => new Promise(_res => {}));

export type TsWorkerClient = typeof dummyClient;

export const TsWorkerContext = createContext(dummyClient);
