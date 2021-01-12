import { atom, atomFamily } from "./atom";
import flatten from "lodash/flatten";

export const nodeIDMap = atom<any>({});

export const nodeIDs = atom<string[]>(
    (get) => Object.keys(get(nodeIDMap)),
    (get, set, update) => {
        set(nodeIDMap, Object.fromEntries(update.map((u) => [u, true])))

    }
);

export const connectionIDMap = atom<any>({});

export const connectionIDs = atom<string[]>(
    (get) => Object.keys(get(connectionIDMap)),
    (get, set, update) =>
        set(connectionIDMap, Object.fromEntries(update.map((u) => [u, true])))
);

export const getConnectionParams = atomFamily((id: string) => ({
    from: "null",
    to: "null",
}));

export const getConnectionMetadata = atomFamily((id: string) => ({
    type: "",
    id: id,
}));

export const getNodeMetadata = atomFamily(
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

export const getPinMetadata = atomFamily((id: string) => ({
    type: "",
    id: id,
    name: "",
    parentNode: null,
    index: -1,
}));

export const getNodePortIDMap = atomFamily<any>((id: string) => ({}));

export const getNodePinIDs = atomFamily<string[]>(
    (id: string) => (get) => Object.keys(get(getNodePortIDMap(id))),
    (id: string) => (get, set, update) =>
        set(getNodePortIDMap(id), Object.fromEntries(update.map((u) => [u, true])))
);

export const getPinConnectionIDs = atomFamily((id: string) => (get) =>
    get(connectionIDs).filter(
        (connID) =>
            get(getConnectionParams(connID)).from === id ||
            get(getConnectionParams(connID)).to === id
    )
);

export const getNodeConnectionIDs = atomFamily((id: string) => (get) => {
    return flatten(
        get(getNodePinIDs(id)).map((outputID) => get(getPinConnectionIDs(outputID)))
    );
});

