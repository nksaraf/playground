import * as React from "react";
import { useMachine } from "../../api";
import { useAtom } from "../../api/state/atom";
import { machine, selector } from "../../api";
import { IBrush } from "../../api/types";

export function SelectionBrush() {
  const [brush] = useAtom(selector.selectionBrush);
  const state = useMachine();
  const [active] = useAtom(machine.activeState);

  React.useEffect(() => {
    if (active.includes("waitingForDoublePress")) {
      const i = setTimeout(() => {
        state.send("STOP_WAITING_FOR_DOUBLE_PRESS", null);
      }, 400);
      return () => {
        clearTimeout(i);
      };
    }
  }, [active, state.send]);

  return active.includes("brushSelecting") ? <Brush {...brush} /> : null;
}

export function Brush({ x0, y0, x1, y1 }: IBrush) {
  return (
    <rect
      x={Math.min(x0, x1)}
      y={Math.min(y0, y1)}
      width={Math.abs(x1 - x0)}
      height={Math.abs(y1 - y0)}
      fill="rgba(0,0,100, .1)"
      stroke="rgba(0,0,100, .2)"
      strokeWidth={1}
    />
  );
}
