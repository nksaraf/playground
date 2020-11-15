import { IPoint } from "../../types"
import { atom } from "../atom"
import { graph } from "./graph"
import { scene } from "./scene"
import { undo } from "./undo"
import * as Comlink from "comlink"

import { atomFamily } from "../atom"
import flatten from "lodash/flatten"
import { Actions } from "./index"
import { getBoundingBox } from "../utils"

type GetFromWorker = (type: string, payload: any) => Promise<any>

export const getFromWorker = Comlink.wrap<GetFromWorker>(
	new Worker("service.worker.js")
)

const selectionBrushStart = atom(null as null | IPoint)
const selectionBrushEnd = atom(null as null | IPoint)

const selectedNodeIDs = atom([])
const selectedConnectionIDs = atom([])

const selected = atom((get) => ({
	nodesIDs: get(selectedNodeIDs),
	connectionIDs: get(selectedConnectionIDs),
}))

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

const moveDraggingBoxes = atom(null, (get, set) => {
	const pointer = get(scene.screenPointer)
	get(selector.selectedNodeIDs).forEach((id) => {
		set(graph.getNodePosition(id), (pos) => ({
			x: pos.x + pointer.dx,
			y: pos.y + pointer.dy,
		}))
	})
})

const clearSelection = atom(null, (get, set) => {
	set(selectedConnectionIDs, [])
	set(selectedNodeIDs, [])
})

const deleteSelected = atom(null, (get, set) => {
	const selectedIDs = get(selectedNodeIDs)
	const connectionIDs = flatten([
		...selectedIDs.map((id) => graph.getNodeConnectionIDs(id)),
		get(selectedConnectionIDs),
	])

	set(clearSelection, null)

	set(graph.nodeIDs, (ids) => ids.filter((id) => !selectedIDs.includes(id)))
	set(graph.connectionIDs, (ids) =>
		ids.filter((id) => !connectionIDs.includes(id))
	)
})

const startBrushWithWorker = atom(null, (get, set) => {
	const { x, y } = get(scene.documentPointer)

	const { documentPointer } = get(scene.lastPointState)
	set(selectionBrushStart, { ...documentPointer })
	set(selectionBrushEnd, { x, y })

	getFromWorker("selecter", {
		origin: { x, y },
	})
})
const initialSelectedNodeIDs = atom([])

const setInitialSelectedIDs = atom(null, (get, set) => {
	set(initialSelectedNodeIDs, [...get(selectedNodeIDs)])
})

const moveBrush = atom(null, (get, set) => {
	set(selectionBrushEnd, { ...get(scene.documentPointer) })
})

const completeBrush = atom(null, (get, set) => {
	set(selectionBrushStart, null)
	set(selectionBrushEnd, null)
})

const setSelectedIdsFromWorker = atom(null, (get, set) => {
	getFromWorker("selected", get(scene.documentPointer)).then((r) => {
		if (r.length !== get(selectedNodeIDs).length) {
			set(selectedNodeIDs, r)
		}
	})
})

const isNodeSelected = atomFamily((id: string) => (get) =>
	get(selectedNodeIDs).includes(id)
)

const selectToolState = atom(
	"selectingIdle" as
		| "selectingIdle"
		| "dragging"
		| "inserting"
		| "edgeResizing"
		| "cornerResizing"
		| "pointingCanvas"
		| "brushSelecting"
		| "waitingForDoublePress"
)

export const selector = {
	selectionBrushStart,
	selectionBrushEnd,
	selectionBrush,
	selected,
	selectToolState,
	isNodeSelected,
	selectedNodeIDs,
	selectedConnectionIDs,
	selectionBounds,
	actions: {
		clearSelection,
		deleteSelected,
		startBrushWithWorker,
		setInitialSelectedIDs,
		moveBrush,
		completeBrush,
		setSelectedIdsFromWorker,
	},
}

export const selectToolDispatch = atom(null, (get, set, action: Actions) => {
	switch (get(selectToolState)) {
		case "selectingIdle": {
			switch (action.type) {
				case "ESCAPE": {
					set(selector.actions.clearSelection, null)
					return
				}
				case "BACKSPACE": {
					set(undo.actions.saveUndoState, null)
					set(selector.actions.deleteSelected, null)
					set(undo.actions.saveUndoState, null)
					return
				}
				case "POINTER_DOWN_ON_CANVAS": {
					set(selectToolState, "pointingCanvas")
					return
				}
				case "POINTER_DOWN_ON_BOX": {
					console.log(get(selector.isNodeSelected(action.payload.id)))
					if (!get(selector.isNodeSelected(action.payload.id))) {
						set(selector.selectedNodeIDs, [action.payload.id])
					}
					set(selectToolState, "dragging")
					return
				}
				case "POINTER_DOWN_ON_BOUNDS": {
					set(selectToolState, "dragging")

					return
				}
			}
			return
		}
		case "dragging": {
			switch (action.type) {
				case "POINTER_MOVE": {
					set(moveDraggingBoxes)
					// set(selectToolState, "dragActive")
					return
				}
				case "POINTER_UP": {
					set(selectToolState, "selectingIdle")
					return
				}
			}
			return
		}

		case "pointingCanvas": {
			switch (action.type) {
				case "POINTER_MOVE": {
					const { screenPointer: initial, camera } = get(scene.lastPointState)
					const pointer = get(scene.screenPointerPosition)

					set(scene.cameraPosition, {
						x: camera.x - (pointer.x - initial.x),
						y: camera.y - (pointer.y - initial.y),
					})

					// const isDistanceFarEnough =
					// 	Math.hypot(pointer.x - initial.x, pointer.y - initial.y) > 4

					// if (isDistanceFarEnough) {
					// 	set(selectToolState, "brushSelecting")
					// 	set(clearSelection, null)
					// 	set(startBrushWithWorker, null)
					// 	set(setInitialSelectedIDs, null)
					// }
					// return
					return
				}
				case "POINTER_UP": {
					set(selector.actions.clearSelection, null)
					set(selectToolState, "waitingForDoublePress")
					return
				}
			}
			return
		}
		case "waitingForDoublePress": {
			switch (action.type) {
				case "POINTER_DOWN_ON_CANVAS": {
					set(selectToolState, "brushSelecting")
					set(selector.actions.clearSelection, null)
					set(selector.actions.startBrushWithWorker, null)
					set(selector.actions.setInitialSelectedIDs, null)
					return
				}
				case "STOP_WAITING_FOR_DOUBLE_PRESS": {
					set(selectToolState, "selectingIdle")
					return
				}
			}
			return
		}
		case "brushSelecting": {
			switch (action.type) {
				case "POINTER_MOVE": {
					set(selector.actions.moveBrush, null)
					set(selector.actions.setSelectedIdsFromWorker, null)
					return
				}
				case "POINTER_UP": {
					set(selector.actions.completeBrush, null)
					set(selectToolState, "selectingIdle")
					return
				}
			}
			return
		}
	}
})
