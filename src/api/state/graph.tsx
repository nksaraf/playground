import { atomFamily } from "./atom";

import { model } from "./model";
import { IFrame, IPoint, ISize } from "../types";

export const getNodePosition = atomFamily<IPoint>((id: string) => ({
  x: 0,
  y: 0,
}));
const getPinOffset = atomFamily((id: string) => ({ x: 0, y: 0 }));

const getPinPosition = atomFamily((id: string) => (get) => {
  const port = get(model.getPinMetadata(id));
  const nodePos = get(getNodePosition(port.parentNode));
  const portOffset = get(getPinOffset(id));

  return { x: nodePos.x + portOffset.x, y: nodePos.y + portOffset.y };
});

const getNodeSize = atomFamily<ISize>((id: string) => ({
  width: 0,
  height: 0,
}));

const getNodeBox = atomFamily<IFrame>((id: string) => (get) => ({
  ...get(getNodeSize(id)),
  ...get(getNodePosition(id)),
  id,
}));

const getConnectionPosition = atomFamily((id: string) => (get) => {
  const params = get(model.getConnectionParams(id));

  return {
    start: get(getPinPosition(params.from)),
    end: get(getPinPosition(params.to)),
  };
});

export const graph = {
  getNodePosition,
  getNodeBox,
  getNodeSize,
  getPinOffset,
  getPinPosition,
  getConnectionPosition,
};
