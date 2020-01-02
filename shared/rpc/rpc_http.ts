import { ProtocolClient, ProtocolDef, ProtocolImpl } from "./rpc_definition";

type MsgRequest = {
  funcName: string;
  arg?: unknown;
};

type MsgResponse = {
  response?: unknown;
};

type UntypedProtocolImpl = (
  req: MsgRequest
) => MsgResponse | Promise<MsgResponse>;

export const implementProtocol = <Def extends ProtocolDef>(
  def: Def,
  impl: ProtocolImpl<Def>
): UntypedProtocolImpl => {
  return function handleReq({ funcName, arg }) {
    if (!(funcName in def)) throw new Error("uknown method name " + funcName);

    const response = (impl as any)[funcName](arg);

    if (response instanceof Promise) {
      return response.then(r => ({ response: r }));
    }

    return { response };
  };
};

export const createProtocolClient = <Def extends ProtocolDef>(
  def: Def,
  sendMsg: (msg: MsgRequest) => Promise<MsgResponse>
): ProtocolClient<Def> => {
  return Object.fromEntries(
    Object.keys(def).map(funcName => [
      funcName,
      (arg: unknown) => sendMsg({ funcName, arg }).then(r => r.response)
    ])
  ) as any;
};

// const createAPI = (): ClientAPI => {
//   type GetArgs = {
//     [K in keyof API]: API[K] extends (args: infer R1) => any
//       ? (args: R1) => R1
//       : never;
//   };

//   const api: GetArgs = {
//     checkForUpdates: i => i,
//     joinSession: i => i,
//     postEvent: i => i,
//     startSession: i => i
//   };

//   return Object.fromEntries(
//     Object.entries(api).map(([apiFuncName, _]) => [
//       apiFuncName,
//       (args: unknown) => {
//         console.log(`api:send:${apiFuncName}`, args);
//         return postData(`http://localhost:${PORT}/`, {
//           func: apiFuncName,
//           args
//         }).then(data => {
//           console.log(`api:reply:${apiFuncName}`, data);
//           return data;
//         });
//       }
//     ])
//   ) as any;
// };

// function postData(url: string, data: unknown) {
//   // console.log("!!!!", JSON.stringify(data));
//   // Default options are marked with *
//   const req = fetch(url, {
//     method: "POST", // *GET, POST, PUT, DELETE, etc.
//     mode: "cors", // no-cors, *cors, same-origin
//     // cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
//     headers: {
//       "Content-Type": "text/plain"
//       // 'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     body: JSON.stringify(data) // body data type must match "Content-Type" header
//   });

//   // console.log({ req });

//   return req.then(res => res.json());
// }
