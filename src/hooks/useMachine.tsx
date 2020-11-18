import * as React from "react";
import { useUpdateAtom } from "../lib/atom";
import { Actions, machine } from "../state/machine";

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
