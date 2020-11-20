import * as React from "react";
import { useAtom } from "../../api";
import { Spline } from "./Connection";
import { machine, scene } from "../../api";

import { model } from "../../api";
import { atom } from "../../api";
import { graph } from "../../api";

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

export function InsertingConnectortGhost() {
  const [state] = useAtom(machine.activeState);
  const [connectorPin] = useAtom(addingConnectorFromPin);
  const [pointer] = useAtom(scene.documentPointer);
  const start =
    connectorPin.metadata.type === "output" ? connectorPin.position : pointer;
  const end =
    connectorPin.metadata.type === "output" ? pointer : connectorPin.position;

  return state.includes("insertingConnector") ? (
    <>
      <Spline start={start} end={end} className="connector" />
      <circle cx={pointer.x} cy={pointer.y} r={3} fill="#4299e1" />
    </>
  ) : null;
}
