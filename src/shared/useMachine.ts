import { useRef, useState, useEffect } from "react";
import {
  AnyEffectsDeclaration,
  UpdateFunction,
  EffectHandler,
  MachineInstance,
  instantiate,
  AnyCommand
} from "./stateMachine";

interface ResultBox<T> {
  v: T;
}

export function useConstant<T>(fn: () => T): T {
  const ref = useRef<ResultBox<T>>();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
}

type HookReturnType<State, Ev> = [
  State,
  MachineInstance<State, Ev>["send"],
  MachineInstance<State, Ev>
];

export function useMachine<State, Ev, Effects extends AnyEffectsDeclaration>(
  update: UpdateFunction<State, Ev, Effects>,
  init: () => [State, AnyCommand<Effects, Ev>?],
  effectHandler: EffectHandler<Effects, void>
): HookReturnType<State, Ev>;
export function useMachine<
  State,
  Ev,
  Effects extends AnyEffectsDeclaration,
  Context
>(
  update: UpdateFunction<State, Ev, Effects>,
  init: () => [State, AnyCommand<Effects, Ev>?],
  effectHandler: EffectHandler<Effects, Context>,
  context: Context
): HookReturnType<State, Ev>;
export function useMachine<
  State,
  Ev,
  Effects extends AnyEffectsDeclaration,
  Context = void
>(
  update: UpdateFunction<State, Ev, Effects>,
  init: () => [State, AnyCommand<Effects, Ev>?],
  effectHandler: EffectHandler<Effects, Context>,
  context?: Context
): HookReturnType<State, Ev> {
  //   if (process.env.NODE_ENV !== "production") {
  //     const [initialMachine] = useState(stateMachine);

  //     if (stateMachine !== initialMachine) {
  //       throw new Error(
  //         "Machine given to `useMachine` has changed between renders. This is not supported and might lead to unexpected results.\n" +
  //           "Please make sure that you pass the same Machine as argument each time."
  //       );
  //     }
  //   }

  const instance = useConstant(() =>
    instantiate(update, init, effectHandler, context!)
  );

  const [current, setCurrent] = useState(instance.getState());

  //   useEffect(() => {
  //     if (options) {
  //       (service as any)._machine._options = options;
  //     }
  //   });

  useEffect(() => {
    instance.listenChanges(setCurrent).start();
    return () => {
      instance.stop();
    };
  }, []);

  return [current, instance.send, instance];
}
