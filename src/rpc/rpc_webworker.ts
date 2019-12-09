import { ProtocolClient, ProtocolDef, ProtocolImpl } from "./rpc_definition";

type MsgRequest = {
  portId: number;
  funcName: string;
  msgId: number;
  arg?: unknown;
};

type MsgResponse = {
  portId: number;
  msgId: number;
  response?: unknown;
};

export const workerRpcClient = <Def extends ProtocolDef>(
  definition: Def,
  worker: Worker,
  portId: number
): ProtocolClient<Def> => {
  const map = new Map<number, (data?: unknown) => void>();

  worker.addEventListener("message", ({ data }) => {
    const { portId: respPortId, response, msgId }: MsgResponse = JSON.parse(
      data
    );

    if (respPortId !== portId) return;

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
    const req: MsgRequest = { funcName, msgId, portId, arg };

    map.set(msgId, onResponse);
    msgId += 1;
    worker.postMessage(JSON.stringify(req));
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
  impl: ProtocolImpl<Def>,
  portId: number
) => {
  addEventListener("message", ({ data }) => {
    const { portId: respPortId, arg, funcName, msgId }: MsgRequest = JSON.parse(
      data
    );

    if (respPortId !== portId) return;

    if (!(funcName in impl)) {
      throw new Error(
        `unregistered request: funcName=${funcName}, msgId=${msgId}, portId=${portId}`
      );
    }

    const resp = impl[funcName](arg);
    const send = (response?: unknown) => {
      const respMsg: MsgResponse = { portId, msgId, response };
      postMessage(JSON.stringify(respMsg));
    };

    if (resp instanceof Promise) {
      resp.then(send);
    } else {
      send(resp);
    }
  });
};
