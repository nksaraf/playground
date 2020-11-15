import * as React from "react"
import { atom, atomFamily } from "../atom"
import { Node } from "../components/nodes/Node"
export const library = atom(["dummy"])
export const getComponentMetadata = atomFamily((id: string) => ({
	render: Node,
	type: "",
	id,
}))

export const registerComponent = atom(
	null,
	(get, set, { componentID, render, type, ...meta }) => {
		const oldLib = get(library)
		if (oldLib.includes(componentID)) {
			throw new Error(`${componentID} already exists in the library`)
		}
		set(library, [...oldLib, componentID])
		set(getComponentMetadata(componentID), { render, type, ...meta })
	}
)
