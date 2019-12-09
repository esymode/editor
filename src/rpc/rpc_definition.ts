import { AnyBinType, Static } from "ts-binary-types";

export type FunctionDefFull<
  Args extends AnyBinType,
  Returns extends AnyBinType
> = {
  arg: Args;
  returns: Returns;
};

export type FunctionDefArgs<Args extends AnyBinType> = {
  arg: Args;
};

export type FunctionDefNoArgs<Returns extends AnyBinType> = {
  returns: Returns;
};

export type AnyFunctionDef =
  | FunctionDefFull<AnyBinType, AnyBinType>
  | FunctionDefArgs<AnyBinType>
  | FunctionDefNoArgs<AnyBinType>;

export type ProtocolDef = Readonly<{
  [funcName: string]: Readonly<AnyFunctionDef>;
}>;

export type ProtocolClient<Def extends ProtocolDef> = {
  [K in keyof Def]: Def[K] extends FunctionDefFull<infer Arg, infer Res>
    ? (arg: Static<Arg>) => Promise<Static<Res>>
    : Def[K] extends FunctionDefArgs<infer Arg>
    ? (arg: Static<Arg>) => Promise<void>
    : Def[K] extends FunctionDefNoArgs<infer Res>
    ? () => Promise<Static<Res>>
    : never;
};

export type ProtocolImpl<Def extends ProtocolDef> = {
  [K in keyof Def]: Def[K] extends FunctionDefFull<infer Arg, infer Res>
    ? (arg: Static<Arg>) => Static<Res> | Promise<Static<Res>>
    : Def[K] extends FunctionDefArgs<infer Arg>
    ? (arg: Static<Arg>) => void | Promise<void>
    : Def[K] extends FunctionDefNoArgs<infer Res>
    ? () => Static<Res> | Promise<Static<Res>>
    : never;
};
