// import { Union, of } from "ts-union";

type EffectDecl<Arg, Data> = [Arg, Data] & { readonly phantom: unique symbol };

type Effect<Type extends string, Arg, Data> = {
  name: Type;
  arg: Arg;
  phantomRes?: Data; // this is just to remember type. It is not actually there
};

const EFFECT_TOKEN = "this is effect";

export const effect = <
  EffFunc extends (a: any) => any
>(): EffFunc extends () => infer Data
  ? EffectDecl<null, Data>
  : EffFunc extends (a: infer Arg) => infer Data
  ? EffectDecl<Arg, Data>
  : never => EFFECT_TOKEN as any;

type DescObj = { [key: string]: EffectDecl<any, any> };

export const declareEffects = <Desc extends DescObj>(
  desc: Desc
): {
  [K in keyof Desc]: Desc[K] extends EffectDecl<infer Arg, infer Data>
    ? K extends string
      ? Arg extends null
        ? () => Effect<K, null, Data>
        : (arg: Arg) => Effect<K, Arg, Data>
      : never
    : never;
} =>
  Object.fromEntries(
    Object.entries(desc).map(([name]) => [
      name,
      (arg: unknown): Effect<string, unknown, unknown> => ({ name, arg })
    ])
  ) as any;

export type AnyEffectsDeclaration = ReturnType<typeof declareEffects>;

type Command<Type extends string, Arg, Data, Ev> = [
  Effect<Type, Arg, Data>,
  (data: Data) => Ev
];

type AnyCommandObjectForm<Effects extends AnyEffectsDeclaration, Ev> = {
  [K in keyof Effects]: Effects[K] extends (
    arg: infer Arg
  ) => Effect<infer Type, infer Arg, infer Data>
    ? Command<Type, Arg, Data, Ev>
    : never;
};

export type AnyCommand<
  Effects extends AnyEffectsDeclaration,
  Ev
> = AnyCommandObjectForm<Effects, Ev>[keyof AnyCommandObjectForm<Effects, Ev>];

export const cmd = <Type extends string, Arg, Data, Ev>(
  eff: Effect<Type, Arg, Data>,
  f: (data: Data) => Ev
): Command<Type, Arg, Data, Ev> => [eff, f];

export type UpdateFunction<State, Ev, Effects extends AnyEffectsDeclaration> = (
  prev: State,
  ev: Ev
) => [State, AnyCommand<Effects, Ev>?];

export type EffectHandler<
  Effects extends AnyEffectsDeclaration,
  Context = void
> = {
  [K in keyof Effects]: K extends string
    ? Effects[K] extends (arg: any) => Effect<K, infer Arg, infer Data>
      ? (arg: Arg, ctx: Context) => Promise<Data> | Data
      : never
    : never;
};

export function instantiate<State, Ev, Effects extends AnyEffectsDeclaration>(
  update: UpdateFunction<State, Ev, Effects>,
  init: () => [State, AnyCommand<Effects, Ev>?],
  effectHandler: EffectHandler<Effects, void>
): MachineInstance<State, Ev>;
export function instantiate<
  State,
  Ev,
  Effects extends AnyEffectsDeclaration,
  Context
>(
  update: UpdateFunction<State, Ev, Effects>,
  init: () => [State, AnyCommand<Effects, Ev>?],
  effectHandler: EffectHandler<Effects, Context>,
  context: Context
): MachineInstance<State, Ev>;
export function instantiate<
  State,
  Ev,
  Effects extends AnyEffectsDeclaration,
  Context = void
>(
  update: UpdateFunction<State, Ev, Effects>,
  init: () => [State, AnyCommand<Effects, Ev>?],
  effectHandler: EffectHandler<Effects, Context>,
  context?: Context
): MachineInstance<State, Ev> {
  let [state, command] = init();

  let listeners: ((state: State) => void)[] = [];
  let started = false;

  function handleEv(ev: Ev) {
    if (!started) return;
    const prevState = state;
    [state, command] = update(state, ev);
    const wasUpdated = prevState !== state;

    if (wasUpdated)
      for (const listener of listeners) {
        listener(state);
      }

    if (command) runCmd(command);
  }

  function runCmd([eff, createEv]: AnyCommand<Effects, Ev>) {
    const { name, arg } = eff;

    // here we trust type system to do the right thing for context
    // if we need it the types will ensure that it was provided
    // if it is omitted context will be undefined regardless
    const effResult = effectHandler[name](arg, context!);

    // here it can be either the data or a Promise.
    // regardless we rely on type system to make sure that effResult has the right type
    // to create an event
    if (effResult instanceof Promise) {
      effResult.then(r => handleEv(createEv(r)));
    } else {
      handleEv(createEv(effResult));
    }
  }

  const instance: MachineInstance<State, Ev> = {
    getState: () => state,

    start: () => {
      if (started) return instance;
      started = true;
      if (command) runCmd(command);
      return instance;
    },

    send: ev => {
      handleEv(ev);
      return instance;
    },

    listenChanges: listener => {
      listeners.push(listener);
      return instance;
    },

    stopListening: listener => {
      listeners = listeners.filter(l => l !== listener);
      return instance;
    }
  };

  return instance;
}

export interface MachineInstance<
  State,
  Ev
  //   Effects extends AnyEffectsDeclaration
  //   Context = unknown
> {
  getState: () => State;

  start: () => MachineInstance<State, Ev>;
  //   stop: () => MachineInstance<State, Ev>;

  send: (ev: Ev) => MachineInstance<State, Ev>;

  //   run: (
  //     command: AnyCommand<Effects, Ev>
  //   ) => MachineInstance<State, Ev>;

  listenChanges: (
    listener: (state: State) => void
  ) => MachineInstance<State, Ev>;

  stopListening: (
    listener: (state: State) => void
  ) => MachineInstance<State, Ev>;
}
