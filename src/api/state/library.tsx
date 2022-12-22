import { atom, atomFamily } from "./atom";

export const componentIDs = atom([]);

type Component = {
    render?: Function;
    type: string;
    id: string;
    pins: any[];
    metadata: any;
};

export const getComponentMetadata = atomFamily<Component>((id: string) => ({
    render: null,
    type: "missing",
    id,
    pins: [],
    metadata: {},
}));

export const components = atom((get) =>
    get(componentIDs).map((id) => get(getComponentMetadata(id)))
);

