import { atom, atomFamily } from "../lib/atom";
import flatten from "lodash/flatten";

const nodeIDMap = atom<any>({});

const nodeIDs = atom<string[]>(
  (get) => Object.keys(get(nodeIDMap)),
  (get, set, update) =>
    set(nodeIDMap, Object.fromEntries(update.map((u) => [u, true])))
);
const connectionIDMap = atom<any>({});

const connectionIDs = atom<string[]>(
  (get) => Object.keys(get(connectionIDMap)),
  (get, set, update) =>
    set(connectionIDMap, Object.fromEntries(update.map((u) => [u, true])))
);

const getConnectionParams = atomFamily((id: string) => ({
  from: "null",
  to: "null",
}));

const getConnectionMetadata = atomFamily((id: string) => ({
  type: "",
  id: id,
}));

const getNodeMetadata = atomFamily(
  (id: string) =>
    ({
      type: "component",
      componentID: "-1",
      id: id,
    } as {
      id: string;
      type: string;
      componentID: string;
      [key: string]: any;
    })
);
const getPinMetadata = atomFamily((id: string) => ({
  type: "",
  id: id,
  name: "",
  parentNode: null,
  index: -1,
}));

const getNodePortIDMap = atomFamily<any>((id: string) => ({}));

const getNodePinIDs = atomFamily<string[]>(
  (id: string) => (get) => Object.keys(get(getNodePortIDMap(id))),
  (id: string) => (get, set, update) =>
    set(getNodePortIDMap(id), Object.fromEntries(update.map((u) => [u, true])))
);

const getPinConnectionIDs = atomFamily((id: string) => (get) =>
  get(connectionIDs).filter(
    (connID) =>
      get(getConnectionParams(connID)).from === id ||
      get(getConnectionParams(connID)).to === id
  )
);

const getNodeConnectionIDs = atomFamily((id: string) => (get) => {
  return flatten(
    get(getNodePinIDs(id)).map((outputID) => get(getPinConnectionIDs(outputID)))
  );
});

export const model = {
  nodeIDs,
  connectionIDs,
  getConnectionParams,
  getConnectionMetadata,
  getNodePinIDs,
  getNodeMetadata,
  getNodeConnectionIDs,
  getPinMetadata,
  getPinConnectionIDs,
};
