import { createContext } from "create-hook-context"
import React from "react"
import { useAtom } from "../lib/atom"
import { graph, selector } from "../state"
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
	outputIDs: graph.getNodeOutputIDs(id),
	size: graph.getNodeSize(id),
	isSelected: selector.isNodeSelected(id),
	connectionIDs: graph.getNodeConnectionIDs(id),
	metadata: graph.getNodeMetadata(id),
	id,
})

export let getPinAtoms = (id: string) => ({
	position: graph.getNodePosition(id),
	inputIDs: graph.getNodeInputIDs(id),
	outputIDs: graph.getNodeOutputIDs(id),
	size: graph.getNodeSize(id),
	isSelected: selector.isNodeSelected(id),
	connectionIDs: graph.getNodeConnectionIDs(id),
	metadata: graph.getNodeMetadata(id),
	id,
})

export type NodeAtoms = ReturnType<typeof getNodeAtoms>

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const [metadata] = useAtom(graph.getNodeMetadata(nodeID))
	const [component] = useAtom(getComponentMetadata(metadata.componentID))
	const Component = component.render

	const node = getNodeAtoms(nodeID)
	return (
		<NodeProvider node={node}>
			<Component node={node} />
		</NodeProvider>
	)
})
