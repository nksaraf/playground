import { IPoint } from "../../types"
import { atom, atomFamily } from "../lib/atom"
import { graph } from "./graph"

import { getBoundingBox } from "../lib/utils"

const selectionBrushStart = atom(null as null | IPoint)
const selectionBrushEnd = atom(null as null | IPoint)

const selectedNodeIDs = atom([])
const selectedConnectionIDs = atom([])

const selectionBounds = atom((get) => {
	const ids = get(selectedNodeIDs)
	if (ids.length === 0) {
		return null
	} else {
		return getBoundingBox(ids.map((id) => get(graph.getNodeBox(id))))
	}
})

const selectionBrush = atom((get) => {
	const start = get(selectionBrushStart)
	const end = get(selectionBrushEnd)

	if (start && end) {
		return { x0: start.x, y0: start.y, x1: end.x, y1: end.y }
	} else {
		return null
	}
})

const getNodeIsSelected = atomFamily((id: string) => (get) =>
	get(selectedNodeIDs).includes(id)
)

const focusedNode = atom(null as string | null)

const getNodeIsFocused = atomFamily((id: string) => (get) =>
	get(focusedNode) === id
)

export const selector = {
	selectionBrushStart,
	selectionBrushEnd,
	selectionBrush,
	getNodeIsSelected,
	selectedNodeIDs,
	selectedConnectionIDs,
	focusedNode,
	getNodeIsFocused,
	selectionBounds,
}
