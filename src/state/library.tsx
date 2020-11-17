import { atom, atomFamily } from "../lib/atom"
import { NumberValue, SumNumbers } from "../plugins/math"

const core = {}

function registerComp(Component) {
	const { id, inputs = {}, outputs = {}, ...metadata } = Component.config
	core[Component.config.id] = {
		render: Component,
		id,
		pins: [
			...Object.keys(inputs).map((i) => ({
				...inputs[i],
				name: i,
				role: "input",
			})),
			...Object.keys(outputs).map((i) => ({
				...outputs[i],
				name: i,
				role: "output",
			})),
		],
		type: "component",
		metadata,
	}
}

registerComp(NumberValue)
registerComp(SumNumbers)

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
				render: null,
				type: "missing",
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
// 		const oldLib = get(componentIDs)
// 		if (oldLib.includes(componentID))) {
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
