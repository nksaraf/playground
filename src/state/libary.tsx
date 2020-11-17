import { atom, atomFamily } from "../lib/atom"
import { Node } from "../components/nodes/Node"
import React from "react"

const createCompute = ({
	render,
	id,
	inputs = {},
	outputs = {},
	...props
}) => ({
	render,
	id,
	metadata: props,
	pins: [
		...Object.keys(inputs).map((i) => ({
			...inputs[i],
			name: i,
			role: "input",
		})),
		...Object.keys(outputs).map((i) => ({
			...inputs[i],
			name: i,
			role: "output",
		})),
	],
	type: "component",
})

const core = {
	number: createCompute({
		render: React.memo(function NumberValue() {
			return <DataFlowNode></DataFlowNode>
		}),
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
	}),
	"math.sum": createCompute({
		render: Node,
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
	}),
	"math.product": createCompute({
		render: Node,
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
			sum: {
				config: {
					type: "number",
				},
			},
		},
	}),
}

export const componentIDs = atom(Object.keys(core))

type ComputeComponent = {
	render: Function
	type: string
	id: string
	pins: any[]
	metadata: any
}

export const getComponentMetadata = atomFamily<ComputeComponent>((id: string) =>
	core[id]
		? core[id]
		: {
				render: () => {},
				type: "",
				id,
				pins: [],
		  }
)

export const components = atom((get) =>
	get(componentIDs).map((id) => get(getComponentMetadata(id)))
)

// export const registerComponent = atom(
// 	null,
// 	(get, set, { componentID, render, type, ...meta }) => {
// 		const oldLib = get(library)
// 		if (oldLib.includes(componentID)) {
// 			throw new Error(`${componentID} already exists in the library`)
// 		}
// 		set(library, [...oldLib, componentID])
// 		set(getComponentMetadata(componentID), { render, type, ...meta })
// 	}
// )

export const library = {
	components,
	componentIDs,
	getComponentMetadata,
}
