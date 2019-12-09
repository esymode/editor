import { ProtocolClient, ProtocolDef, ProtocolImpl } from "./rpc_definition";

type MsgRequest = {
  isRequest: true;
  portId: number;
  funcName: string;
  msgId: number;
  arg?: unknown;
};

type MsgResponse = {
  isRequest: false;
  portId: number;
  msgId: number;
  response?: unknown;
};

export const workerRpcClient = <Def extends ProtocolDef>(
  definition: Def,
  workerApi: WorkerLikeApi,
  portId: number
): ProtocolClient<Def> => {
  const map = new Map<number, (data?: unknown) => void>();

  workerApi.addEventListener("message", ({ data }) => {
    const {
      portId: respPortId,
      response,
      msgId,
      isRequest
    }: MsgResponse = JSON.parse(data);

    if (respPortId !== portId || isRequest) return;

    const respCallback = map.get(msgId);
    if (!respCallback) {
      throw new Error(
        `unregistered response, msgId=${msgId}, portId=${portId}`
      );
    }

    map.delete(msgId);

    respCallback(response);
  });

  let msgId = 1;

  const send = (
    funcName: string,
    onResponse: (response?: unknown) => void,
    arg?: unknown
  ) => {
    const req: MsgRequest = { isRequest: true, funcName, msgId, portId, arg };

    map.set(msgId, onResponse);
    msgId += 1;
    workerApi.postMessage(JSON.stringify(req));
  };

  return Object.fromEntries(
    Object.entries(definition).map(
      ([funcName]) =>
        [
          funcName,
          (arg?: unknown) =>
            new Promise(resolve => send(funcName, resolve, arg))
        ] as const
    )
  ) as any;
};

export const workerRpcImpl = <Def extends ProtocolDef>(
  _def: Def,
  impl: ProtocolImpl<Def>,
  workerApi: WorkerLikeApi,
  portId: number
) => {
  workerApi.addEventListener("message", ({ data }) => {
    const {
      portId: respPortId,
      arg,
      funcName,
      msgId,
      isRequest
    }: MsgRequest = JSON.parse(data);

    if (respPortId !== portId || !isRequest) return;

    if (!(funcName in impl)) {
      throw new Error(
        `unregistered request: funcName=${funcName}, msgId=${msgId}, portId=${portId}`
      );
    }

    const resp = impl[funcName](arg);
    const send = (response?: unknown) => {
      const respMsg: MsgResponse = {
        portId,
        msgId,
        response,
        isRequest: false
      };
      workerApi.postMessage(JSON.stringify(respMsg));
    };

    if (resp instanceof Promise) {
      resp.then(send);
    } else {
      send(resp);
    }
  });
};

export type WorkerLikeApi = Pick<
  Worker,
  "addEventListener" | "postMessage" | "removeEventListener"
>;
