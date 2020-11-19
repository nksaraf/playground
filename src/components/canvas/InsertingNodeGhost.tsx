import * as React from "react";
import { model } from "../../api";
import { atom, useAtom } from "../../api";
import { machine, graph, scene } from "../../api";
import { ComponentGhost } from "./ComponentGhost";

export function InsertingNodeGhost() {
  const [state] = useAtom(machine.activeState);
  const [pointer] = useAtom(scene.documentPointer);

  return state.includes("insertingComponent") ? (
    <ComponentGhost x={pointer.x} y={pointer.y} />
  ) : null;
}

export const addingConnectorFromPin = atom((get) => {
  return {
    position: get(
      graph.getPinPosition(get(machine.insertTool.addingConnectorFromPinID))
    ),
    metadata: get(
      model.getPinMetadata(get(machine.insertTool.addingConnectorFromPinID))
    ),
  };
});
