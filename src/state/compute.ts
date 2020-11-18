import { atomFamily } from "../lib/atom";
import { model } from "./model";

const getNodeInputIDs = atomFamily((id: string) => (get) => {
  const nodePins = get(model.getNodePinIDs(id))
    .map((pid) => get(model.getPinMetadata(pid)))
    .filter((port) => port.type === "input");

  return nodePins.map((np) => np.id);
});

const getNodeOutputIDs = atomFamily((id: string) => (get) => {
  const nodePins = get(model.getNodePinIDs(id))
    .map((pid) => get(model.getPinMetadata(pid)))
    .filter((port) => port.type === "output");

  return nodePins.map((np) => np.id);
});

const getPinRawValue = atomFamily((id: string) => null);

const getPinValue = atomFamily(
  (id: string) => (get) => {
    const metadata = get(model.getPinMetadata(id));
    if (metadata.type === "input") {
      const connIDs = get(model.getPinConnectionIDs(id));
      if (connIDs.length === 0) {
        return get(getPinRawValue(id));
      } else {
        const con = get(model.getConnectionParams(connIDs[0]));
        return get(getPinRawValue(con.from));
      }
    } else {
      return get(getPinRawValue(id));
    }
  },
  (id: string) => (get, set, update) => {
    set(getPinRawValue(id), update);
  }
);

const getNodeState = atomFamily((id) => ({} as any));

const getNodeInputValues = atomFamily((id: string) => (get) =>
  Object.fromEntries(
    get(getNodeInputIDs(id)).map((id) => [
      get(model.getPinMetadata(id)).name,
      get(getPinValue(id)),
    ])
  )
);

export const compute = {
  getPinValue,
  getPinRawValue,
  getNodeInputIDs,
  getNodeInputValues,
  getNodeState,
  getNodeOutputIDs,
};
