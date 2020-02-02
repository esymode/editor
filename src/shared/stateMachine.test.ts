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

test("handles sending events directly", async () => {
  type Ev = { type: "add" | "set"; n: number } | { type: "double" };
  type State = number;

  const Effects = declareEffects({ double: effect<(n: number) => number>() });

  const update: UpdateFunction<State, Ev, typeof Effects> = (prev, ev) => {
    switch (ev.type) {
      case "add":
        return [prev + ev.n];
      case "set":
        return [ev.n];
      case "double":
        return [prev, cmd(Effects.double(prev), n => ({ type: "set", n }))];
    }
  };

  const changes: State[] = [];
  const machine = instantiate(update, () => [0], { double: n => 2 * n })
    .listenChanges(s => changes.push(s))
    .start();

  // nothing happened yet
  expect(changes).toStrictEqual([]);

  machine.send({ type: "add", n: 3 });
  expect(changes).toStrictEqual([3]);

  machine.send({ type: "double" });
  expect(changes).toStrictEqual([3, 6]);
});

test("you can return just an effect instead of cmd", async () => {
  const Effects = declareEffects({ eff: effect<() => void>() });

  const update: UpdateFunction<number, "invoke Eff", typeof Effects> = (
    prev,
    _ev
  ) => {
    return [prev, Effects.eff()];
  };

  let effectFiredCount = 0;

  const machine = instantiate(update, () => [0], {
    eff: () => {
      effectFiredCount += 1;
    }
  }).start();

  // nothing happened yet
  expect(effectFiredCount).toBe(0);

  machine.send("invoke Eff");
  expect(effectFiredCount).toBe(1);
});
