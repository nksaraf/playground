import React from "react"
import { useAtom } from "../../atom"
import { graph, useMachine } from "../../state"
import { getComponentMetadata } from "../../state/libary"
import { getNodeAtoms, NodeProvider } from "../nodes/Node"

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const [metadata] = useAtom(graph.getNodeMetadata(nodeID))
	const [component] = useAtom(getComponentMetadata(metadata.componentID))
	const Component = component.render
	const node = getNodeAtoms(nodeID)
	const send = useMachine()
	return (
		<NodeProvider node={node}>
			<Component node={node} send={send} useAtom={useAtom} />
		</NodeProvider>
	)
})
