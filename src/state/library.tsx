import { atom, atomFamily } from "../lib/atom";

import { SkeletonNode } from "../components/nodes/SkeletonNode";

const componentIDs = atom([]);

type ComputeComponent = {
  render: Function;
  type: string;
  id: string;
  pins: any[];
  metadata: any;
};

const getComponentMetadata = atomFamily<ComputeComponent>((id: string) => ({
  render: SkeletonNode,
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
