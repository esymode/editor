// -------------- Result --------------
export interface Ok<T> {
  _type: "result";
  tag: "Ok";
  val: T;
}

export interface Err<E> {
  _type: "result";
  tag: "Err";
  err: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

const Ok = <T>(val: T): Ok<T> => ({ _type: "result", tag: "Ok", val });
const Err = <E>(err: E): Err<E> => ({ _type: "result", tag: "Err", err });

const isResult = <T, E>(val: unknown): val is Result<T, E> =>
  val !== undefined &&
  val !== null &&
  typeof val === "object" &&
  (val as any)._type === "result";

// -------------- Option --------------
interface Some<T> {
  _type: "option";
  tag: "Some";
  val: T;
}

interface None {
  _type: "option";
  tag: "None";
  val: null; // attempt to preserve shape
}

export type Option<T> = None | Some<T>;

export const Some = <T>(val: T): Some<T> => ({
  _type: "option",
  tag: "Some",
  val
});

export const None: None = { _type: "option", tag: "None", val: null };

const isOption = <T>(val: unknown): val is Option<T> =>
  val !== undefined &&
  val !== null &&
  typeof val === "object" &&
  (val as any)._type === "option";

// -------------- Operators --------------

export type MapFunc = {
  <A, B>(opt: Option<A>, f: (a: A) => B): Option<B>;
  <A, B, E>(res: Result<A, E>, f: (a: A) => B): Result<B, E>;
};

export const map: MapFunc = ((val: unknown, f: (a: any) => any) => {
  if (isOption(val)) {
    return val.tag === "Some" ? Some(f(val.val)) : val;
  }

  if (isResult(val)) {
    return val.tag === "Ok" ? Ok(f((val as any).val)) : val;
  }

  throw new Error("object was not a result nor an option obj");
}) as any;

export type BindFunc = {
  <A, B>(opt: Option<A>, f: (a: A) => Option<B>): Option<B>;
  <A, B, E>(res: Result<A, E>, f: (a: A) => Result<B, E>): Result<B, E>;
};

export const bind: BindFunc = ((val: unknown, f: (a: any) => any) => {
  if (isOption(val)) {
    return val.tag === "Some" ? f(val.val) : val;
  }

  if (isResult(val)) {
    return val.tag === "Ok" ? f((val as any).val) : val;
  }

  throw new Error("object was not a result nor an option obj");
}) as any;

export type MatchFunc = {
  <A, B>(
    opt: Option<A>,
    cases: {
      Some: (a: A) => B;
      None: () => B;
    }
  ): B;
  <A, B, E>(
    res: Result<A, E>,
    cases: {
      Ok: (a: A) => B;
      Err: (e: E) => B;
    }
  ): B;
};

export const match: MatchFunc = ((
  val: unknown,
  cases: { [c: string]: (a?: any) => any }
) => {
  if (isOption(val)) {
    return val.tag === "Some" ? cases.Some(val.val) : cases.None();
  }

  if (isResult(val)) {
    return val.tag === "Ok"
      ? cases.Ok((val as any).val)
      : cases.Err((val as any).err);
  }

  throw new Error("object was not a result nor an option obj");
}) as any;

//-------------- Pipe & PipeVal ---------------------

export interface Fn<T, R> {
  (val: T): R;
}

export interface PipeValue {
  <T, A>(val: T, fn1: Fn<T, A>): A;
  <T, A, B>(val: T, fn1: Fn<T, A>, fn2: Fn<A, B>): B;
  <T, A, B, C>(val: T, fn1: Fn<T, A>, fn2: Fn<A, B>, fn3: Fn<B, C>): C;
  <T, A, B, C, D>(
    val: T,
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>
  ): D;
  <T, A, B, C, D, E>(
    val: T,
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>
  ): E;
  <T, A, B, C, D, E, F>(
    val: T,
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>
  ): F;
  <T, A, B, C, D, E, F, G>(
    val: T,
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>
  ): G;
  <T, A, B, C, D, E, F, G, H>(
    val: T,
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>,
    fn8: Fn<G, H>
  ): H;
  <T, A, B, C, D, E, F, G, H, I>(
    val: T,
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>,
    fn8: Fn<G, H>,
    fn9: Fn<H, I>
  ): I;
  <T, A, B, C, D, E, F, G, H, I>(
    val: T,
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>,
    fn8: Fn<G, H>,
    fn9: Fn<H, I>,
    ...fns: Fn<any, any>[]
  ): {};
}

export interface Pipe {
  <T, A>(fn1: Fn<T, A>): Fn<T, A>;
  <T, A, B>(fn1: Fn<T, A>, fn2: Fn<A, B>): Fn<T, B>;
  <T, A, B, C>(fn1: Fn<T, A>, fn2: Fn<A, B>, fn3: Fn<B, C>): Fn<T, C>;
  <T, A, B, C, D>(
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>
  ): Fn<T, D>;
  <T, A, B, C, D, E>(
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>
  ): Fn<T, E>;
  <T, A, B, C, D, E, F>(
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>
  ): Fn<T, F>;
  <T, A, B, C, D, E, F, G>(
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>
  ): Fn<T, G>;
  <T, A, B, C, D, E, F, G, H>(
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>,
    fn8: Fn<G, H>
  ): Fn<T, H>;
  <T, A, B, C, D, E, F, G, H, I>(
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>,
    fn8: Fn<G, H>,
    fn9: Fn<H, I>
  ): Fn<T, I>;
  <T, A, B, C, D, E, F, G, H, I>(
    fn1: Fn<T, A>,
    fn2: Fn<A, B>,
    fn3: Fn<B, C>,
    fn4: Fn<C, D>,
    fn5: Fn<D, E>,
    fn6: Fn<E, F>,
    fn7: Fn<F, G>,
    fn8: Fn<G, H>,
    fn9: Fn<H, I>,
    ...fns: Fn<any, any>[]
  ): Fn<T, {}>;
}

export const pipe: Pipe = (...fns: Array<Fn<any, any>>): Fn<any, any> => (
  input: any
) => fns.reduce((prev: any, fn: Fn<any, any>) => fn(prev), input);

export const pipeVal: PipeValue = (
  val: any,
  ...fns: Array<Fn<any, any>>
): any => {
  for (const fn of fns) {
    val = fn(val);
  }
  return val;
};
