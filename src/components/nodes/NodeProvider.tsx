import { createContext } from "create-hook-context";
import React from "react";
import { useAtom } from "../../lib/atom";
import { library, compute, graph, selector, model } from "../../state";
import * as tavern from "../../state";
const [NodeProvider, useNode] = createContext(
  ({ node }: { node: NodeAtoms }) => {
    return node;
  }
);

export { NodeProvider, useNode };

export let getNodeAtoms = (id: string) => ({
  position: graph.getNodePosition(id),
  inputIDs: compute.getNodeInputIDs(id),
  pinIDs: model.getNodePinIDs(id),
  outputIDs: compute.getNodeOutputIDs(id),
  size: graph.getNodeSize(id),
  box: graph.getNodeBox(id),
  isFocused: selector.getNodeIsFocused(id),
  state: compute.getNodeState(id),
  inputValues: compute.getNodeInputValues(id),
  isSelected: selector.getNodeIsSelected(id),
  connectionIDs: model.getNodeConnectionIDs(id),
  metadata: model.getNodeMetadata(id),
  id,
});

export type NodeAtoms = ReturnType<typeof getNodeAtoms>;

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
  const node = React.useMemo(() => getNodeAtoms(nodeID), [nodeID]);
  const [metadata] = useAtom(node.metadata);
  const [component] = useAtom(
    library.getComponentMetadata(metadata.componentID)
  );
  const Component = component.render;

  return (
    <NodeProvider node={node}>
      <Component node={node} tavern={tavern} />
    </NodeProvider>
  );
});
