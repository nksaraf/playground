import { IPoint } from "pixi.js"
import { atom } from "../atom"
import { IFrame } from "../../types"
import { selector, selectToolDispatch } from "./selector"
import { undo } from "./undo"
import { scene } from "./scene"

export const toolState = atom("selectTool")

export const globalDispatch = atom(
	null,
	(get, set, { type, payload }: Actions) => {
		switch (type) {
			case "FORCED_IDS": {
				return set(selector.selectedNodeIDs, payload as any)
			}
			// case "RESET_BOXES": "resetBoxes",
			case "UNDO": {
				return set(undo.actions.loadUndoState, null)
			}
			case "REDO": {
				return set(undo.actions.loadRedoState, null)
			}
			case "STARTED_POINTING": {
				return set(scene.actions.savePointer, payload)
			}
			case "MOVED_POINTER":
				return set(scene.actions.updatePointerOnPointerMove, payload as IPoint)
			case "ZOOMED":
				return set(scene.actions.updateCameraZoom, payload as number)
			case "PANNED": {
				set(scene.actions.updateCameraPoint, payload as IPoint)
				set(scene.actions.updatePointerOnPan, payload as IPoint)
				return
			}
			case "SCROLLED_VIEWPORT":
				return set(scene.actions.updateViewBoxOnScroll, payload as IPoint)
			case "UPDATED_VIEWBOX": {
				set(scene.actions.updateCameraOnViewBoxChange, payload as IFrame)
				set(scene.actions.updateViewBox, payload as IFrame)
				return
			}
		}
	}
)

const states = {
	selectTool: selector.selectToolState,
	insertTool: selector.selectToolState,
}

export const activeState = atom((get) => {
	return [get(toolState), get(states[get(toolState)])]
})

export const dispatch = atom(null, (get, set, action: Actions) => {
	// action.type !== "MOVED_POINTER" && console.log(action)
	set(globalDispatch, action)
	set(selectToolDispatch, action)
})

export type Action<S, T = undefined> = {
	type: S
	payload: T
}

export type Actions =
	| Action<"UPDATED_VIEWBOX", IFrame>
	| Action<"MOVED_POINTER", IPoint | undefined>
	| Action<"CANCELLED">
	| Action<"DELETED_SELECTED">
	| Action<"INSERT_NEW_COMPONENT", { componentID: string }>
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
