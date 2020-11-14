import { IPoint } from "pixi.js"
import { atom } from "../atom"
import { IFrame } from "../../types"
import { selector, selectToolDispatch } from "./selector"
import { undo } from "./undo"
import { scene } from "./scene"
import { graph, insertToolDispatch } from "./graph"

export const toolState = atom("selectTool")

export const globalDispatch = atom(null, (get, set, action: Actions) => {
	switch (action.type) {
		case "FORCED_IDS": {
			return set(selector.selectedNodeIDs, action.payload as any)
		}
		// case "RESET_BOXES": "resetBoxes",
		case "UNDO": {
			return set(undo.actions.loadUndoState, null)
		}
		case "REDO": {
			return set(undo.actions.loadRedoState, null)
		}
		case "STARTED_POINTING": {
			return set(scene.actions.savePointer, action.payload)
		}
		case "INSERT_NEW_COMPONENT": {
			set(toolState, "insertTool")
			set(insertToolDispatch, action)
			return
		}
		case "MOVED_POINTER":
			return set(
				scene.actions.updatePointerOnPointerMove,
				action.payload as IPoint
			)
		case "ZOOMED":
			return set(scene.actions.updateCameraZoom, action.payload)
		case "PANNED": {
			set(scene.actions.updateCameraPoint, action.payload)
			set(scene.actions.updatePointerOnPan, action.payload)
			return
		}
		case "SCROLLED_VIEWPORT":
			return set(scene.actions.updateViewBoxOnScroll, action.payload)
		case "UPDATED_VIEWBOX": {
			set(scene.actions.updateCameraOnViewBoxChange, action.payload)
			set(scene.actions.updateViewBox, action.payload)
			return
		}
	}
})

const states = {
	selectTool: selector.selectToolState,
	insertTool: graph.insertToolState,
}

export const activeState = atom((get) => {
	return `${get(toolState)}.${get(states[get(toolState)])}`
})

export const dispatch = atom(null, (get, set, action: Actions) => {
	// action.type !== "MOVED_POINTER" && console.log(action)
	set(globalDispatch, action)
	switch (get(toolState)) {
		case "selectTool": {
			set(selectToolDispatch, action)
			return
		}
		case "insertTool": {
			set(insertToolDispatch, action)
			return
		}
	}
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
