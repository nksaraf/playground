import { atom, atomFamily } from "./atom";

const componentIDs = atom([]);

type Component = {
  render?: Function;
  type: string;
  id: string;
  pins: any[];
  metadata: any;
};

const getComponentMetadata = atomFamily<Component>((id: string) => ({
  render: null,
  type: "missing",
  id,
  pins: [],
  metadata: {},
}));

const components = atom((get) =>
  get(componentIDs).map((id) => get(getComponentMetadata(id)))
);

export const library = {
  components,
  componentIDs,
  getComponentMetadata,
};
