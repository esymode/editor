import { createContext } from "react";

import { clientServerAPI } from "shared/client_server_api";
import { createProtocolClient } from "shared/rpc/rpc_http";

const dummyClient = createProtocolClient(
  clientServerAPI,
  () => new Promise(_res => {})
);

export type APIClient = typeof dummyClient;

export const ApiContext = createContext(dummyClient);
