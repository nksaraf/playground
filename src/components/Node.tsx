import { createContext } from "create-hook-context"
import React from "react"
import { useAtom } from "../lib/atom"
import { useUpdate } from "../sdk"
import { compute, graph, selector } from "../state"
import { getComponentMetadata } from "../state/library"

const [NodeProvider, useNode] = createContext(
	({ node }: { node: NodeAtoms }) => {
		return node
	}
)

export { NodeProvider, useNode }

export let getNodeAtoms = (id: string) => ({
	position: graph.getNodePosition(id),
	inputIDs: graph.getNodeInputIDs(id),
	pinIDs: graph.getNodePinIDs(id),
	outputIDs: graph.getNodeOutputIDs(id),
	size: graph.getNodeSize(id),
	state: compute.getNodeState(id),
	inputValues: compute.getNodeInputValues(id),
	isSelected: selector.getNodeIsSelected(id),
	connectionIDs: graph.getNodeConnectionIDs(id),
	metadata: graph.getNodeMetadata(id),
	id,
})

export let getPinAtoms = (id: string) => ({
	position: graph.getNodePosition(id),
	inputIDs: graph.getNodeInputIDs(id),
	outputIDs: graph.getNodeOutputIDs(id),
	size: graph.getNodeSize(id),
	isSelected: selector.getNodeIsSelected(id),
	connectionIDs: graph.getNodeConnectionIDs(id),
	metadata: graph.getNodeMetadata(id),
	id,
})

export type NodeAtoms = ReturnType<typeof getNodeAtoms>

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const node = React.useMemo(() => getNodeAtoms(nodeID), [nodeID])
	const [metadata] = useAtom(node.metadata)
	const [component] = useAtom(getComponentMetadata(metadata.componentID))
	const Component = component.render

	return (
		<NodeProvider node={node}>
			<Component node={node} />
		</NodeProvider>
	)
})
