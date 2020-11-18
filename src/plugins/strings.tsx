import React from "react"
import { ComputeNode } from "../components/nodes/DataNode"
import { useCompute } from "../sdk"

export function SumNumbers() {
	useCompute(({ a, b }) => {
		return { concat: a + b }
	})

	return <ComputeNode />
}

SumNumbers.config = {
	id: "string.concat",
	title: "+ Concat",
	inputs: {
		a: {
			config: {
				type: "number",
			},
		},
		b: {
			config: {
				type: "number",
			},
		},
	},
	outputs: {
		concat: {
			config: {
				type: "number",
			},
		},
	},
}
