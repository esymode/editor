import {
  cmd,
  declareEffects,
  effect,
  UpdateFunction,
  instantiate
} from "./stateMachine";

test("registers initial change", () => {
  type Ev = number;
  type State = number;

  const Effects = declareEffects({ getNum: effect<() => number>() });

  const update: UpdateFunction<State, Ev, typeof Effects> = (prev, ev) => [
    prev + ev
  ];

  const changes: State[] = [];
  instantiate(update, () => [0, cmd(Effects.getNum(), n => n)], {
    getNum: () => 100
  })
    .listenChanges(s => changes.push(s))
    .start();

  // registered changes
  expect(changes).toStrictEqual([100]);
});

test("handles a sync effect loop", () => {
  type Ev = number;
  type State = number;

  const Effects = declareEffects({ getNum: effect<() => number>() });

  const update: UpdateFunction<State, Ev, typeof Effects> = (prev, ev) => [
    prev + ev,
    prev < 4 ? cmd(Effects.getNum(), n => n) : undefined
  ];

  const changes: State[] = [];
  instantiate(update, () => [0, cmd(Effects.getNum(), n => n)], {
    getNum: () => 1
  })
    .listenChanges(s => changes.push(s))
    .start();

  expect(changes).toStrictEqual([1, 2, 3, 4, 5]);
});

test("passes arguments to effects", () => {
  type Ev = number;
  type State = number;

  const Effects = declareEffects({ double: effect<(n: number) => number>() });

  const update: UpdateFunction<State, Ev, typeof Effects> = (prev, ev) => [
    prev + ev
  ];

  const changes: State[] = [];
  instantiate(update, () => [0, cmd(Effects.double(2), n => n)], {
    double: n => 2 * n
  })
    .listenChanges(s => changes.push(s))
    .start();

  expect(changes).toStrictEqual([4]);
});

test("handles async effects", async () => {
  type Ev = number;
  type State = number;

  const Effects = declareEffects({ double: effect<(n: number) => number>() });

  const update: UpdateFunction<State, Ev, typeof Effects> = (prev, ev) => [
    prev + ev
  ];

  const changes: State[] = [];

  await new Promise(resolve => {
    instantiate(update, () => [0, cmd(Effects.double(2), n => n)], {
      double: n => Promise.resolve(2 * n)
    })
      .listenChanges(s => {
        changes.push(s), resolve();
      })
      .start();
  });

  expect(changes).toStrictEqual([4]);
});
