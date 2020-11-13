import { IPoint, IFrame } from "../../types"
import { atom } from "./atom"
import { graph } from "./graph"

import {
	clearSelection,
	saveUndoState,
	deleteSelected,
	startBrushWithWorker,
	setInitialSelectedIDs,
	moveBrush,
	setSelectedIdsFromWorker,
	completeBrush,
	loadUndoState,
	loadRedoState,
	setPointer,
	updatePointerOnPointerMove,
	updateCameraZoom,
	updateCameraPoint,
	updatePointerOnPan,
	updateViewBoxOnScroll,
	updateCameraOnViewBoxChange,
	updateViewBox,
	scene,
} from "./index"

export const selectToolState = atom(
	"selectingIdle" as
		| "selectingIdle"
		| "dragging"
		| "edgeResizing"
		| "cornerResizing"
		| "pointingCanvas"
		| "brushSelecting"
		| "recentlyPointed"
)

// const justTouched = atom(false)

const resetTouch = atom(null, (get, set) => {
	if (get(selectToolState) === "recentlyPointed") {
		set(selectToolState, "seletingIdle")
	}
})

const selectToolDispatch = atom(
	null,
	(get, set, { payload, type }: Actions) => {
		switch (get(selectToolState)) {
			case "selectingIdle": {
				switch (type) {
					case "CANCELLED": {
						set(clearSelection, null)
						return
					}
					case "DELETED_SELECTED": {
						set(saveUndoState, null)
						set(deleteSelected, null)
						set(saveUndoState, null)
						return
					}
					// case "STARTED_POINTING_BOUNDS_EDGE": {
					// 	set(selectToolState, "edgeResizing")
					// 	return
					// }
					// case "STARTED_POINTING_BOUNDS_CORNER": {
					// 	set(selectToolState, "cornerResizing")
					// 	return
					// }
					case "STARTED_POINTING_CANVAS": {
						set(selectToolState, "pointingCanvas")
						const i = setTimeout(() => {
							set(resetTouch, null)
						}, 100)
						return
					}
					// case "DOUBLE_TAPPED_CANVAS": {
					// 	set(selectToolState, "brushSelecting")
					// 	set(clearSelection, null)
					// 	set(startBrushWithWorker, null)
					// 	set(setInitialSelectedIDs, null)
					// 	return
					// }
					case "STARTED_POINTING_BOX": {
						if (!get(graph.isNodeSelected((payload as any).id))) {
							set(graph.selectedNodeIDs, [(payload as any).id])
						}
						set(selectToolState, "dragging")
						return
					}
					case "STARTED_POINTING_BOUNDS": {
						set(selectToolState, "dragging")
						return
					}
				}
				return
			}
			case "pointingCanvas": {
				// click and drag to select
				// switch (type) {
				// 	case "MOVED_POINTER": {
				// 		const initial = get(scene.lastPointPosition)
				// 		const pointer = get(scene.screenPointerPosition)

				// 		const isDistanceFarEnough =
				// 			Math.hypot(pointer.x - initial.x, pointer.y - initial.y) > 4

				// 		if (isDistanceFarEnough) {
				// 			set(selectToolState, "brushSelecting")
				// 			set(clearSelection, null)
				// 			set(startBrushWithWorker, null)
				// 			set(setInitialSelectedIDs, null)
				// 		}
				// 		return
				// 	}
				// 	case "STOPPED_POINTING": {
				// 		set(clearSelection, null)
				// 		set(selectToolState, "selectingIdle")
				// 		return
				// 	}
				// }

				switch (type) {
					case "MOVED_POINTER": {
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
					case "STOPPED_POINTING": {
						set(clearSelection, null)
						set(selectToolState, "recentlyPointed")
						return
					}
				}
				return
			}
			case "recentlyPointed": {
				switch (type) {
					case "STARTED_POINTING_CANVAS": {
						set(selectToolState, "brushSelecting")
						set(clearSelection, null)
						set(startBrushWithWorker, null)
						set(setInitialSelectedIDs, null)
						return
					}
					case "RESET_POINTED": {
						set(selectToolState, "selectingIdle")
						return
					}
				}
				return
			}
			case "brushSelecting": {
				switch (type) {
					case "MOVED_POINTER": {
						set(moveBrush, null)
						set(setSelectedIdsFromWorker, null)
						return
					}
					case "STOPPED_POINTING": {
						set(completeBrush, null)
						set(selectToolState, "selectingIdle")
						return
					}
				}
				return
			}
		}
	}
)

const toolState = atom("selectTool")

const globalDispatch = atom(null, (get, set, { type, payload }: Actions) => {
	switch (type) {
		case "FORCED_IDS": {
			return set(graph.selectedNodeIDs, payload as any)
		}
		// case "RESET_BOXES": "resetBoxes",
		case "UNDO": {
			return set(loadUndoState, null)
		}
		case "REDO": {
			return set(loadRedoState, null)
		}
		case "STARTED_POINTING": {
			return set(setPointer, payload)
		}
		case "MOVED_POINTER":
			return set(updatePointerOnPointerMove, payload as IPoint)
		case "ZOOMED":
			return set(updateCameraZoom, payload as number)
		case "PANNED": {
			set(updateCameraPoint, payload as IPoint)
			set(updatePointerOnPan, payload as IPoint)
			return
		}
		case "SCROLLED_VIEWPORT":
			return set(updateViewBoxOnScroll, payload as IPoint)
		case "UPDATED_VIEWBOX": {
			set(updateCameraOnViewBoxChange, payload as IFrame)
			set(updateViewBox, payload as IFrame)
			return
		}
	}
})

export const dispatch = atom(null, (get, set, action: Actions) => {
	// action.type !== "MOVED_POINTER" && console.log(action)
	set(globalDispatch, action)
	set(selectToolDispatch, action)
})

export const machine = {
	toolState,
	globalDispatch,
	dispatch,
	selectToolDispatch,
	selectToolState,
}

export type Action<S, T = undefined> = {
	type: S
	payload: T
}

export type Actions =
	| Action<"UPDATED_VIEWBOX", IFrame>
	| Action<"MOVED_POINTER", IPoint | undefined>
	| Action<"CANCELLED">
	| Action<"DELETED_SELECTED">
	// | Action<"STARTED_POINTING_BOUNDS_EDGE">
	// | Action<"STARTED_POINTING_BOUNDS_CORNER">
	| Action<"STARTED_POINTING_CANVAS">
	| Action<"STARTED_POINTING_BOX", { id: string }>
	| Action<"STARTED_POINTING_BOUNDS">
	| Action<"STOPPED_POINTING">
	| Action<"FORCED_IDS">
	| Action<"RESET_POINTED">
	| Action<"UNDO">
	| Action<"REDO">
	| Action<"STARTED_POINTING">
	| Action<"DOUBLE_TAPPED_CANVAS">
	| Action<"ZOOMED", number>
	| Action<"PANNED", IPoint>
	| Action<"SCROLLED_VIEWPORT", IPoint>
	| Action<"UPDATED_VIEWBOX", IFrame>
