import { atom, atomFamily } from "../lib/atom"
import { IFrame, IPoint } from "../../types"
import { selector, selectTool } from "./selector"
import { undo } from "./undo"
import { scene } from "./scene"
import { graph, insertToolDispatch } from "./graph"

export const toolState = atom("selectTool")

const keyboardModifierMode = atomFamily((key: string) => false)

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
		case "POINTER_DOWN": {
			return set(scene.actions.savePointer, action.payload)
		}
		case "POINTER_DOWN_ON_COMPONENT_BUTTON": {
			set(toolState, "insertTool")
			set(insertToolDispatch, action)
			return
		}
		case "POINTER_DOWN_ON_PIN": {
			set(toolState, "insertTool")
			set(insertToolDispatch, action)
			return
		}
		// case "POINTER_DOWN_ON_COMPONENT_BUTTON": {
		// 	set(toolState, "insertTool")
		// 	set(insertToolDispatch, action)
		// 	return
		// }
		case "POINTER_MOVE":
			return set(scene.actions.updatePointerOnPointerMove, action.payload)
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
	selectTool: selectTool.state,
	insertTool: graph.insertToolState,
}

export const activeState = atom((get) => {
	return `${get(toolState)}.${get(states[get(toolState)])}`
})

export const stateTree = atom<StateTreeNode>((get) => {
	return {
		name: "root",
		active: true,
		states: {
			selectTool: {
				name: "selectTool",
				active: get(toolState) === "selectTool",
				states: {
					selectingIdle: {
						name: "selectingIdle",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "selectingIdle",
						states: {},
					},
					dragging: {
						name: "dragging",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "dragging",
						states: {},
					},
					inserting: {
						name: "inserting",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "inserting",
						states: {},
					},
					edgeResizing: {
						name: "edgeResizing",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "edgeResizing",
						states: {},
					},
					cornerResizing: {
						name: "cornerResizing",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "cornerResizing",
						states: {},
					},
					pointingCanvas: {
						name: "pointingCanvas",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "pointingCanvas",
						states: {},
					},
					brushSelecting: {
						name: "brushSelecting",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "brushSelecting",
						states: {},
					},
					waitingForDoublePress: {
						name: "waitingForDoublePress",
						active:
							get(toolState) === "selectTool" &&
							get(selectTool.state) === "waitingForDoublePress",
						states: {},
					},
				},
			},
			insertTool: {
				name: "insertTool",
				active: get(toolState) === "insertTool",
				states: {
					insertIdle: {
						name: "insertIdle",
						active:
							get(toolState) === "insertTool" &&
							get(graph.insertToolState) === "insertIdle",
						states: {},
					},
					insertingConnector: {
						name: "insertingConnector",
						active:
							get(toolState) === "insertTool" &&
							get(graph.insertToolState) === "insertingConnector",
						states: {},
					},
					insertingComponent: {
						name: "insertingComponent",
						active:
							get(toolState) === "insertTool" &&
							get(graph.insertToolState) === "insertingComponent",
						states: {},
					},
				},
			},
		},
	}
})

export const dispatch = atom(null, (get, set, action: Actions) => {
	set(globalDispatch, action)
	switch (get(toolState)) {
		case "selectTool": {
			set(selectTool.dispatch, action)
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
	| Action<"POINTER_MOVE", IPoint | undefined>
	| Action<"POINTER_DOWN_ON_COMPONENT_BUTTON", { componentID: string }>
	| Action<"POINTER_DOWN_ON_PIN", { pinID: string }>
	| Action<"POINTER_UP_ON_PIN", { pinID: string }>
	// | Action<"POINTER_DOWN_ON_BOUNDS_EDGE">
	// | Action<"POINTER_DOWN_ON_BOUNDS_CORNER">
	| Action<"POINTER_DOWN_ON_CANVAS">
	| Action<"POINTER_DOWN_ON_BOX", { id: string }>
	| Action<"POINTER_DOWN_ON_BOUNDS">
	| Action<"POINTER_UP">
	| Action<"FORCED_IDS">
	| Action<"STOP_WAITING_FOR_DOUBLE_PRESS">
	| Action<"UNDO">
	| Action<"REDO">
	| Action<"POINTER_DOWN">
	| Action<"DOUBLE_TAPPED_CANVAS">
	| Action<"ZOOMED", number>
	| Action<"PANNED", IPoint>
	| Action<"SCROLLED_VIEWPORT", IPoint>
	| Action<"UPDATED_VIEWBOX", IFrame>
	| Action<"ESCAPE">
	| Action<"ENTERED_ALT_MODE">
	| Action<"ENTERED_SPACE_MODE">
	| Action<"BACKSPACE">
	| Action<"ENTERED_SHIFT_MODE">
	| Action<"ENTERED_CONTROL_MODE">
	| Action<"ENTERED_META_MODE">
	| Action<"EXITED_ALT_MODE">
	| Action<"EXITED_SPACE_MODE">
	| Action<"EXITED_SHIFT_MODE">
	| Action<"EXITED_CONTROL_MODE">
	| Action<"EXITED_META_MODE">
	| Action<"PASTED">
	| Action<"COPIED">

import * as React from "react"
import { useUpdateAtom } from "../lib/atom"
import { StateTreeNode } from "../lib/logger"

export function useMachine() {
	const send = useUpdateAtom(dispatch)
	return {
		send: React.useCallback(
			(type: Actions["type"], payload?: Actions["payload"]) => {
				send({ type, payload } as any)
			},
			[send]
		),
	}
}
