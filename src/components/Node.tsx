import * as React from "react"
import { useMachine } from "../hooks/useMachine"
import { useAtom } from "../atom"
import { graph } from "../state/graph"
import { ControlledNode } from "./graph/Node"
import { selector } from "../state"

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const [isSelected, setIsSelected] = useAtom(selector.isNodeSelected(nodeID))
	const [{ type: nodeType }] = useAtom(graph.getNodeMetadata(nodeID))
	const [nodePosition, setNodePosition] = useAtom(graph.getNodePosition(nodeID))
	const [nodeInputIDs] = useAtom(graph.getNodeInputIDs(nodeID))
	const [nodeOutputIDs] = useAtom(graph.getNodeOutputIDs(nodeID))
	const [nodeSize, setNodeSize] = useAtom(graph.getNodeSize(nodeID))
	const machine = useMachine()
	return (
		<ControlledNode
			onResize={setNodeSize}
			isSelected={isSelected}
			onClick={() => machine.send("STARTED_POINTING_BOX", { id: nodeID })}
			nodeId={nodeID}
			position={nodePosition}
			size={nodeSize}
			title={nodeType}
			inputs={nodeInputIDs}
			outputs={nodeOutputIDs}
		/>
	)
})
