import React from "react"
import { useMonacoEditor } from "use-monaco"
import { useNode } from "../components/Node"
import { ComputeNode } from "../components/nodes/DataFlowNode"
import { useAtom } from "../lib/atom"
import { useUpdate } from "../sdk"
import { compute } from "../state"

export function Monaco() {
	const node = useNode()
	const update = useUpdate(node)
	const [{ value = "a" }, setVal] = useAtom(compute.getNodeState(node.id))

	React.useEffect(() => {
		update("value", value)
	}, [update, value])

	const { containerRef } = useMonacoEditor({
		path: "model.graphql",
		theme: "vs-light",
		onChange: (e) => {
			setVal({ value: e })
		},
		defaultValue: ["a"].join("\n"),
	})

	return (
		<ComputeNode>
			<div ref={containerRef} style={{ height: 300, width: 300 }}></div>
		</ComputeNode>
	)
}

Monaco.config = {
	id: "monaco",
	outputs: {
		value: {
			config: {
				type: "string",
			},
		},
	},
}
