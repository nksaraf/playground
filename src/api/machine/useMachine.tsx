import * as React from "react";
import { useUpdateAtom } from "../state/atom";
import { Actions, machine } from "./machine";

export function useMachine() {
  const send = useUpdateAtom(machine.dispatch);
  return {
    send: React.useCallback(
      (type: Actions["type"], payload?: Actions["payload"]) => {
        send({ type, payload });
      },
      [send]
    ),
  };
}
