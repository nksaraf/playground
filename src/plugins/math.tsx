import { multiply, sum } from "lodash"
import React from "react"
import { useRecoilCallback } from "recoil"
import { NodeAtoms, useNode } from "../components/Node"
import { DataFlowNode } from "../components/nodes/DataFlowNode"
import { atomFamily, useAtom } from "../lib/atom"
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

export function NumberValue() {
	const node = useNode()
	const update = useUpdate(node)
	const [val, setVal] = React.useState(10)

	React.useEffect(() => {
		update("value", val)
	}, [update, val])

	return (
		<DataFlowNode>
			<div>{val}</div>
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

export function SumNumbers() {
	useCompute(({ ...inputs }) => {
		return { sum: sum(Object.values(inputs).map((i) => (i === null ? 0 : i))) }
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

export function ProductNumbers() {
	useCompute(({ a, b }) => {
		return {
			product: (a ?? 0) * (b ?? 0),
		}
	})
	return (
		<DataFlowNode>
			<div className="w-12" />
		</DataFlowNode>
	)
}

ProductNumbers.config = {
	id: "math.product",
	title: "Product",
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
		product: {
			config: {
				type: "number",
			},
		},
	},
}
