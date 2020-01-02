import { useRef } from "react";

export type Thunk<S, A> = (dispatch: (a: A) => void, getState: () => S) => void;
export type ThunkDispatch<S, A> = (a: A | Thunk<S, A>) => void;

export function useThunk<S, A>([state, dispatch]: [S, (a: A) => void]): [
  S,
  ThunkDispatch<S, A>
] {
  const stateRef = useRef<S>(state);
  stateRef.current = state;

  const getStateRef = useRef(() => stateRef.current);

  const newDispatchRef = useRef((action: A | Thunk<S, A>) => {
    if (typeof action === "function") {
      (action as any)(newDispatchRef.current, getStateRef.current);
    } else {
      dispatch(action);
    }
  });

  return [state, newDispatchRef.current];
}
