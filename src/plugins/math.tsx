import { sum } from "lodash"
import React from "react"
import { useRecoilCallback } from "recoil"
import { NodeAtoms, useNode } from "../components/Node"
import { DataFlowNode } from "../components/nodes/DataFlowNode"
import { useAtom } from "../lib/atom"
import { graph } from "../state"
import { compute, getPinValue } from "../state/compute"

function useUpdate(node: NodeAtoms) {
	return useRecoilCallback(
		({ snapshot, set }) => async (name, val) => {
			const outputIDs = await snapshot.getPromise(node.outputIDs)
			const id = outputIDs.find(
				(id) =>
					(snapshot.getLoadable(graph.getPinMetadata(id)).contents as any)
						.name === name
			)
			if (id) {
				set(getPinValue(id), val)
			}
		},
		[]
	)
}

export function NumberValue() {
	const node = useNode()
	const update = useUpdate(node)

	React.useEffect(() => {
		update("value", 10)
	}, [update])

	return (
		<DataFlowNode>
			<div></div>
		</DataFlowNode>
	)
}

NumberValue.config = {
	id: "number",
	title: "Number",
	outputs: {
		value: {
			config: {
				type: "number",
			},
		},
	},
	inputs: {},
}

function useCompute(fn) {
	const node = useNode()
	const update = useUpdate(node)
	const [inputs] = useAtom(compute.getNodeInputValues(node.id))

	React.useEffect(() => {
		const result = fn(inputs)
		Object.keys(result).forEach((key) => {
			update(key, result[key])
		})
	}, [...Object.values(inputs), update])
}

export function SumNumbers() {
	useCompute(({ ...inputs }) => {
		return { sum: sum(Object.values(inputs).map((i) => (i === null ? 0 : 1))) }
	})
	return (
		<DataFlowNode>
			<div className="w-12" />
		</DataFlowNode>
	)
}

SumNumbers.config = {
	id: "math.sum",
	title: "Sum",
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
		sum: {
			config: {
				type: "number",
			},
		},
	},
}
