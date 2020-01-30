import * as React from "react";
import {
  declareEffects,
  effect,
  UpdateFunction,
  cmd,
  EffectHandler
} from "./stateMachine";
import { useMachine } from "./useMachine";

const Effects = declareEffects({
  getInitial: effect<() => number>(),
  randomNumber: effect<(range: number) => number>()
});

const effectHandler: EffectHandler<typeof Effects> = {
  getInitial: () => 1,
  randomNumber: range => Promise.resolve(Math.random() * range)
};

type State = number | undefined;
type Event = { type: "add" | "set"; value: number } | { type: "addRandom" };

const update: UpdateFunction<State, Event, typeof Effects> = (prev, ev) => {
  switch (ev.type) {
    case "add":
      return prev === undefined ? [prev] : [prev + ev.value];

    case "set":
      return [ev.value];

    case "addRandom":
      return [
        prev,
        cmd(Effects.randomNumber(1), value => ({ type: "add", value }))
      ];
  }
};

export const Example: React.FC = () => {
  const [state, send] = useMachine(
    update,
    () => [
      undefined,
      cmd(Effects.getInitial(), value => ({ type: "set", value } as const))
    ],
    effectHandler
  );

  return (
    <div>
      value:{state}
      <button onClick={() => send({ type: "add", value: 1 })}>add one</button>
      <button onClick={() => send({ type: "addRandom" })}>
        add random value
      </button>
    </div>
  );
};
