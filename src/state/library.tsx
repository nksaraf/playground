import { atom, atomFamily } from "../lib/atom"

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

import importAll from "import-all.macro"

const plugins = importAll.sync("../plugins/*.tsx")

Object.values(plugins).forEach((plugin) => {
	Object.values(plugin).forEach((comp) => {
		registerComp(comp)
		// a
	})
})

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
				type: "missing",
				id,
				pins: [],
				metadata: {},
		  }
)

export const components = atom((get) =>
	get(componentIDs).map((id) => get(getComponentMetadata(id)))
)

export const library = {
	components,
	componentIDs,
	getComponentMetadata,
}
