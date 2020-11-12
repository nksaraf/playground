import {
	IArrowType,
	IPoint,
	IBounds,
	IBrush,
	IBox,
	IFrame,
	IArrow,
	IBoxSnapshot,
} from "../../types"
import { atom } from "./atom"
// import Surface from "../canvas/surface"
import { pressedKeys, getBoundingBox } from "../utils"
import { getInitialData, saveToDatabase } from "./database"
import { BoxSelecter, getBoxSelecter } from "./box-selecter"
import * as BoxTransforms from "./box-transforms"
import clamp from "lodash/clamp"
import uniqueId from "lodash/uniqueId"
import { v4 as uuid } from "uuid"
import flatten from "lodash/flatten"
import * as Comlink from "comlink"
import { graph } from "./graph"
import { scene } from "./scene"

type GetFromWorker = (type: string, payload: any) => Promise<any>

const getFromWorker = Comlink.wrap<GetFromWorker>(
	new Worker("service.worker.js")
)

// let surface: Surface | undefined = undefined
const id = uuid()

function getId() {
	return uniqueId(id)
}

// let selecter: BoxSelecter | undefined
// let resizer: BoxTransforms.EdgeResizer | BoxTransforms.CornerResizer | undefined

const undoState = atom([])
const redoState = atom([])

const snapshot = atom((get) => ({
	nodes: get(graph.nodes),
	connections: get(graph.connections),
	selectedNodeIDs: get(graph.selectedNodeIDs),
	selectedConnectionIDs: get(graph.selectedConnectionIDs),
}))

const saveUndoState = atom(null, (get, set) => {
	const current = get(snapshot)

	getFromWorker("updateTree", {
		boxes: current.nodes,
	})

	const commit = JSON.stringify(current)

	set(redoState, [])
	set(undoState, (undoSt) => [...undoSt, commit])
	saveToDatabase(commit)
})

const loadUndoState = atom(null, (get, set) => {})

const loadRedoState = atom(null, (get, set) => {})

const updatePointerOnPointerMove = atom(null, (get, set, point: IPoint) => {
	if (!point) return // Probably triggered by a zoom / scroll

	const zoom = get(scene.cameraZoom)
	const oldPos = get(scene.screenPointerPosition)
	set(scene.screenPointerPosition, point)
	set(scene.screenPointerDelta, {
		dx: (point.x - oldPos.x) / zoom,
		dy: (point.y - oldPos.y) / zoom,
	})
})

const updatePointerOnPan = atom(null, (get, set, delta: IPoint) => {
	const zoom = get(scene.cameraZoom)
	set(scene.screenPointerDelta, { dx: delta.x / zoom, dy: delta.y / zoom })
})

const updateCameraPoint = atom(null, (get, set, delta: IPoint) => {
	set(scene.cameraPosition, (pos) => ({
		x: pos.x + delta.x,
		y: pos.y + delta.y,
	}))
})

const updateViewBoxOnScroll = atom(null, (get, set, point: IPoint) => {
	const { scrollX, scrollY } = get(scene.viewBoxScroll)

	set(scene.viewBoxPosition, (pos) => ({
		x: pos.x + scrollX - point.x,
		y: pos.y + scrollY - point.y,
	}))

	set(scene.viewBoxScroll, {
		scrollX: point.x,
		scrollY: point.y,
	})
})

const updateCameraOnViewBoxChange = atom(null, (get, set, frame: IFrame) => {
	const viewBox = get(scene.viewBoxSize)
	if (viewBox.width > 0) {
		set(scene.cameraPosition, (pos) => ({
			x: pos.x + (viewBox.width - frame.width) / 2,
			y: pos.y + (viewBox.height - frame.height) / 2,
		}))
	}
})

const updateViewBox = atom(null, (get, set, frame: IFrame) => {
	set(scene.viewBoxPosition, { x: frame.x, y: frame.y })
	set(scene.viewBoxSize, { height: frame.height, width: frame.width })
})

const updateCameraZoom = atom(null, (get, set, newZoom: number) => {
	const prev = get(scene.cameraZoom)
	const next = clamp(prev - newZoom, 0.25, 100)
	const delta = next - prev
	const pointer = get(scene.screenPointerPosition)

	set(scene.cameraZoom, next)
	set(scene.cameraPosition, (pos) => ({
		x: pos.x + ((pos.x + pointer.x) * delta) / prev,
		y: pos.y + ((pos.y + pointer.y) * delta) / prev,
	}))
})

const setPointer = atom(null, (get, set) => {
	set(scene.lastPointPosition, get(scene.documentPointer))
})

const clearSelection = atom(null, (get, set) => {
	set(graph.selectedConnectionIDs, [])
	set(graph.selectedNodeIDs, [])
})

const deleteSelected = atom(null, (get, set) => {
	const selectedIDs = get(graph.selectedNodeIDs)
	const connectionIDs = flatten([
		...selectedIDs.map((id) => graph.getNodeConnectionIDs(id)),
		get(graph.selectedConnectionIDs),
	])

	set(clearSelection, null)

	set(graph.nodeIDs, (ids) => ids.filter((id) => !selectedIDs.includes(id)))
	set(graph.connectionIDs, (ids) =>
		ids.filter((id) => !connectionIDs.includes(id))
	)
})

export const selectToolState = atom(
	"selectingIdle" as
		| "selectingIdle"
		| "dragging"
		| "edgeResizing"
		| "cornerResizing"
		| "pointingCanvas"
		| "brushSelecting"
)

const toolState = atom("selectTool")

const startBrushWithWorker = atom(null, (get, set) => {
	const { x, y } = get(scene.documentPointer)

	const pointer = get(scene.lastPointPosition)
	set(scene.brushStart, { ...pointer })
	set(scene.brushEnd, { x, y })

	getFromWorker("selecter", {
		origin: { x, y },
	})
})
const initialSelectedNodeIDs = atom([])

const setInitialSelectedIDs = atom(null, (get, set) => {
	set(initialSelectedNodeIDs, [...get(graph.selectedNodeIDs)])
})

// const isDistanceFarEnough = atom((get) => {})

const moveBrush = atom(null, (get, set) => {
	set(scene.brushEnd, { ...get(scene.documentPointer) })
})

const setSelectedIdsFromWorker = atom(null, (get, set) => {
	getFromWorker("selected", get(scene.documentPointer)).then((r) => {
		if (r.length !== get(graph.selectedNodeIDs).length) {
			set(graph.selectedNodeIDs, r)
		}
	})
})

const completeBrush = atom(null, (get, set) => {
	// set(scene.brushStart, null)
	// set(scene.brushEnd, null)
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
					case "STARTED_POINTING_BOUNDS_EDGE": {
						set(selectToolState, "edgeResizing")
						return
					}
					case "STARTED_POINTING_BOUNDS_CORNER": {
						set(selectToolState, "cornerResizing")
						return
					}
					case "STARTED_POINTING_CANVAS": {
						set(selectToolState, "pointingCanvas")
						return
					}
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
				switch (type) {
					case "MOVED_POINTER": {
						const initial = get(scene.lastPointPosition)
						const pointer = get(scene.screenPointerPosition)

						const isDistanceFarEnough =
							Math.hypot(pointer.x - initial.x, pointer.y - initial.y) > 4

						if (isDistanceFarEnough) {
							set(selectToolState, "brushSelecting")
							set(clearSelection, null)
							set(startBrushWithWorker, null)
							set(setInitialSelectedIDs, null)
						}
						return
					}
					case "STOPPED_POINTING": {
						set(clearSelection, null)
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

const globalDispatch = atom(null, (get, set, { type, payload }: Actions) => {
	switch (type) {
		case "FORCED_IDS": {
			return set(graph.selectedNodeIDs, payload)
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
	action.type !== "MOVED_POINTER" && console.log(action)
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
	| Action<"STARTED_POINTING_BOUNDS_EDGE">
	| Action<"STARTED_POINTING_BOUNDS_CORNER">
	| Action<"STARTED_POINTING_CANVAS">
	| Action<"STARTED_POINTING_BOX", { id: string }>
	| Action<"STARTED_POINTING_BOUNDS">
	| Action<"STOPPED_POINTING">
	| Action<"FORCED_IDS">
	| Action<"UNDO">
	| Action<"REDO">
	| Action<"STARTED_POINTING">
	| Action<"ZOOMED", number>
	| Action<"PANNED", IPoint>
	| Action<"SCROLLED_VIEWPORT", IPoint>
	| Action<"UPDATED_VIEWBOX", IFrame>

// const state = createState({
// 	data: {
// 		selectedArrowIds: [] as string[],
// 		selectedBoxIds: [] as string[],
// 		// surface: undefined as Surface | undefined,
// 		pointer: {
// 			x: 0,
// 			y: 0,
// 			dx: 0,
// 			dy: 0,
// 		},
// 		camera: {
// 			x: 0,
// 			y: 0,
// 			zoom: 1,
// 		},
// 		viewBox: {
// 			x: 0,
// 			y: 0,
// 			width: 0,
// 			height: 0,
// 			scrollX: 0,
// 			scrollY: 0,
// 			document: {
// 				x: 0,
// 				y: 0,
// 				width: 0,
// 				height: 0,
// 			},
// 		},
// 	},
// 	onEnter: ["saveUndoState", "updateBounds"],
// 	on: {
// 		FORCED_IDS: (d, p) => (d.selectedBoxIds = p),
// 		RESET_BOXES: "resetBoxes",
// 		// UPDATED_SURFACE: (d, p) => (surface = p),
// 		// UNDO: ["loadUndoState", "updateBounds"],
// 		// REDO: ["loadRedoState", "updateBounds"],
// 		// STARTED_POINTING: { secretlyDo: "setInitialPointer" },
// 		// MOVED_POINTER: { secretlyDo: "updatePointerOnPointerMove" },
// 		// ZOOMED: "updateCameraZoom",
// 		// PANNED: ["updateCameraPoint", "updatePointerOnPan"],
// 		// SCROLLED_VIEWPORT: "updateViewBoxOnScroll",
// 		// UPDATED_VIEWBOX: ["updateCameraOnViewBoxChange", "updateViewBox"],
// 	},
// 	initial: "selectTool",
// 	states: {
// 		selectTool: {
// 			initial: "selectingIdle",
// 			states: {
// 				// selectingIdle: {
// 				// 	on: {
// 				// 		CANCELLED: "clearSelection",
// 				// 		SELECTED_BOX_TOOL: { to: "boxTool" },
// 				// 		DELETED_SELECTED: {
// 				// 			if: "hasSelected",
// 				// 			do: [
// 				// 				"saveUndoState",
// 				// 				"deleteSelected",
// 				// 				"updateBounds",
// 				// 				"saveUndoState",
// 				// 			],
// 				// 		},
// 				// 		// ALIGNED_LEFT: [
// 				// 		// 	"alignSelectedBoxesLeft",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// ALIGNED_RIGHT: [
// 				// 		// 	"alignSelectedBoxesRight",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// ALIGNED_CENTER_X: [
// 				// 		// 	"alignSelectedBoxesCenterX",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// ALIGNED_TOP: [
// 				// 		// 	"alignSelectedBoxesTop",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// ALIGNED_BOTTOM: [
// 				// 		// 	"alignSelectedBoxesBottom",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// ALIGNED_CENTER_Y: [
// 				// 		// 	"alignSelectedBoxesCenterY",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// DISTRIBUTED_X: [
// 				// 		// 	"distributeSelectedBoxesX",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// DISTRIBUTED_Y: [
// 				// 		// 	"distributeSelectedBoxesY",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// STRETCHED_X: [
// 				// 		// 	"stretchSelectedBoxesX",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		// STRETCHED_Y: [
// 				// 		// 	"stretchSelectedBoxesY",
// 				// 		// 	"updateBounds",
// 				// 		// 	"saveUndoState",
// 				// 		// ],
// 				// 		STARTED_POINTING_BOUNDS_EDGE: { to: "edgeResizing" },
// 				// 		STARTED_POINTING_BOUNDS_CORNER: { to: "cornerResizing" },
// 				// 		STARTED_POINTING_CANVAS: { to: "pointingCanvas" },
// 				// 		STARTED_POINTING_BOX: [
// 				// 			{ unless: "boxIsSelected", do: ["selectBox", "updateBounds"] },
// 				// 			{ to: "dragging" },
// 				// 		],
// 				// 		STARTED_POINTING_BOUNDS: { to: "dragging" },
// 				// 	},
// 				// },
// 				// pointingCanvas: {
// 				// 	on: {
// 				// 		MOVED_POINTER: { if: "distanceIsFarEnough", to: "brushSelecting" },
// 				// 		STOPPED_POINTING: {
// 				// 			do: ["clearSelection", "updateBounds"],
// 				// 			to: "selectingIdle",
// 				// 		},
// 				// 	},
// 				// },
// 				brushSelecting: {
// 					onEnter: [
// 						"clearSelection",
// 						"startBrushWithWorker",
// 						// "startBrush",
// 						"setInitialSelectedIds",
// 					],
// 					on: {
// 						MOVED_POINTER: [
// 							"moveBrush",
// 							"setSelectedIdsFromWorker",
// 							// {
// 							// 	get: "brushSelectingBoxes",
// 							// 	if: "selectionHasChanged",
// 							// 	do: ["setSelectedIds"],
// 							// },
// 						],
// 						STOPPED_POINTING: {
// 							do: ["completeBrush", "updateBounds"],
// 							to: "selectingIdle",
// 						},
// 					},
// 				},
// 				dragging: {
// 					states: {
// 						dragIdle: {
// 							onEnter: ["setInitialPointer", "setInitialSnapshot"],
// 							on: {
// 								MOVED_POINTER: {
// 									do: ["moveDraggingBoxes", "moveBounds"],
// 									to: "dragActive",
// 								},
// 								STOPPED_POINTING: { to: "selectingIdle" },
// 							},
// 						},
// 						dragActive: {
// 							onExit: "saveUndoState",
// 							on: {
// 								MOVED_POINTER: ["moveDraggingBoxes", "moveBounds"],
// 								STOPPED_POINTING: {
// 									do: ["updateBounds"],
// 									to: "selectingIdle",
// 								},
// 							},
// 						},
// 					},
// 				},
// 				edgeResizing: {
// 					initial: "edgeResizeIdle",
// 					states: {
// 						edgeResizeIdle: {
// 							onEnter: "setEdgeResizer",
// 							on: {
// 								MOVED_POINTER: { do: "resizeBounds", to: "edgeResizeActive" },
// 								STOPPED_POINTING: { to: "selectingIdle" },
// 							},
// 						},
// 						edgeResizeActive: {
// 							onExit: "saveUndoState",
// 							on: {
// 								MOVED_POINTER: { do: "resizeBounds" },
// 								STOPPED_POINTING: { to: "selectingIdle" },
// 							},
// 						},
// 					},
// 				},
// 				cornerResizing: {
// 					initial: "cornerResizeIdle",
// 					states: {
// 						cornerResizeIdle: {
// 							onEnter: "setCornerResizer",
// 							on: {
// 								MOVED_POINTER: {
// 									do: "resizeBounds",
// 									to: "cornerResizeActive",
// 								},
// 								STOPPED_POINTING: { to: "selectingIdle" },
// 							},
// 						},
// 						cornerResizeActive: {
// 							onExit: "saveUndoState",
// 							on: {
// 								MOVED_POINTER: { do: "resizeBounds" },
// 								STOPPED_POINTING: { to: "selectingIdle" },
// 							},
// 						},
// 					},
// 				},
// 			},
// 		},
// 		// boxTool: {
// 		// 	initial: "boxIdle",
// 		// 	states: {
// 		// 		boxIdle: {
// 		// 			on: {
// 		// 				SELECTED_SELECT_TOOL: { to: "selectTool" },
// 		// 				STARTED_POINTING: { to: "drawingBox" },
// 		// 			},
// 		// 		},
// 		// 		drawingBox: {
// 		// 			initial: "drawingBoxIdle",
// 		// 			onEnter: "setBoxOrigin",
// 		// 			states: {
// 		// 				drawingBoxIdle: {
// 		// 					on: {
// 		// 						MOVED_POINTER: { to: "drawingBoxActive" },
// 		// 					},
// 		// 				},
// 		// 				drawingBoxActive: {
// 		// 					onEnter: ["saveUndoState", "clearSelection", "createDrawingBox"],
// 		// 					onExit: ["completeDrawingBox", "saveUndoState"],
// 		// 					on: {
// 		// 						MOVED_POINTER: { do: "updateDrawingBox" },
// 		// 						STOPPED_POINTING: { to: "selectingIdle" },
// 		// 					},
// 		// 				},
// 		// 			},
// 		// 		},
// 		// 	},
// 		// },
// 		// selected: {
// 		//   on: {
// 		//     DOWNED_POINTER: { do: "updateOrigin" },
// 		//   },
// 		//   initial: "selectedIdle",
// 		//   states: {
// 		//     selectedIdle: {
// 		//       on: {
// 		//         CANCELLED: { do: "clearSelection" },
// 		//         STARTED_CLICKING_BOX: { to: "clickingBox" },
// 		//         STARTED_CLICKING_CANVAS: { to: "clickingCanvas" },
// 		//       },
// 		//     },
// 		//     clickingCanvas: {
// 		//       on: {
// 		//         STOPPED_CLICKING_CANVAS: {
// 		//           do: "clearSelection",
// 		//           to: "selectedIdle",
// 		//         },
// 		//         MOVED_POINTER: { if: "dragIsFarEnough", to: "brushSelecting" },
// 		//       },
// 		//     },
// 		//     clickingBox: {
// 		//       onEnter: "setInitialSnapshot",
// 		//       on: {
// 		//         DRAGGED_BOX: { if: "dragIsFarEnough", to: "draggingBox" },
// 		//       },
// 		//     },
// 		//     clickingArrowNode: {
// 		//       on: {
// 		//         DRAGGED_ARROW_NODE: { if: "dragIsFarEnough", to: "drawingArrow" },
// 		//         RELEASED_ARROW_NODE: { to: "pickingArrow" },
// 		//       },
// 		//     },
// 		//     brushSelecting: {
// 		//       onEnter: [
// 		//         "setInitialSelection",
// 		//         "updateSelectionBrush",
// 		//         {
// 		//           if: "isInShiftMode",
// 		//           to: "pushingToSelection",
// 		//           else: { to: "settingSelection" },
// 		//         },
// 		//       ],
// 		//       on: {
// 		//         MOVED_POINTER: { do: "updateSelectionBrush" },
// 		//         SCROLLED: { do: "updateSelectionBrush" },
// 		//         RAISED_POINTER: { do: "completeSelection", to: "selectedIdle" },
// 		//       },
// 		//       initial: "settingSelection",
// 		//       states: {
// 		//         settingSelection: {
// 		//           onEnter: {
// 		//             get: "brushSelectingBoxes",
// 		//             do: "setbrushSelectingToSelection",
// 		//           },
// 		//           on: {
// 		//             ENTERED_SHIFT_MODE: { to: "pushingToSelection" },
// 		//             MOVED_POINTER: {
// 		//               get: "brushSelectingBoxes",
// 		//               if: "brushSelectionHasChanged",
// 		//               do: "setbrushSelectingToSelection",
// 		//             },
// 		//             SCROLLED: {
// 		//               get: "brushSelectingBoxes",
// 		//               if: "brushSelectionHasChanged",
// 		//               do: "setbrushSelectingToSelection",
// 		//             },
// 		//           },
// 		//         },
// 		//         pushingToSelection: {
// 		//           onEnter: {
// 		//             get: "brushSelectingBoxes",
// 		//             do: "pushbrushSelectingToSelection",
// 		//           },
// 		//           on: {
// 		//             EXITED_SHIFT_MODE: { to: "settingSelection" },
// 		//             MOVED_POINTER: {
// 		//               get: "brushSelectingBoxes",
// 		//               do: "pushbrushSelectingToSelection",
// 		//             },
// 		//             SCROLLED: {
// 		//               get: "brushSelectingBoxes",
// 		//               do: "pushbrushSelectingToSelection",
// 		//             },
// 		//           },
// 		//         },
// 		//       },
// 		//     },
// 		//     draggingBoxes: {
// 		//       states: {
// 		//         dragOperation: {
// 		//           initial: "notCloning",
// 		//           states: {
// 		//             notCloning: {
// 		//               onEnter: "clearDraggingBoxesClones",
// 		//               on: {
// 		//                 ENTERED_OPTION_MODE: { to: "cloning" },
// 		//                 RAISED_POINTER: { do: "completeSelectedBoxes" },
// 		//                 CANCELLED: {
// 		//                   do: "restoreInitialBoxes",
// 		//                   to: "selectedIdle",
// 		//                 },
// 		//               },
// 		//             },
// 		//             cloning: {
// 		//               onEnter: "createDraggingBoxesClones",
// 		//               on: {
// 		//                 ENTERED_OPTION_MODE: { to: "notCloning" },
// 		//                 RAISED_POINTER: {
// 		//                   do: ["completeSelectedBoxes", "completeBoxesFromClones"],
// 		//                 },
// 		//                 CANCELLED: {
// 		//                   do: ["restoreInitialBoxes", "clearDraggingBoxesClones"],
// 		//                   to: "selectedIdle",
// 		//                 },
// 		//               },
// 		//             },
// 		//           },
// 		//         },
// 		//         axes: {
// 		//           initial: "freeAxes",
// 		//           states: {
// 		//             freeAxes: {
// 		//               onEnter: "updateDraggingBoxesToLockedAxes",
// 		//               on: {
// 		//                 ENTERED_SHIFT_MODE: { to: "lockedAxes" },
// 		//               },
// 		//             },
// 		//             lockedAxes: {
// 		//               onEnter: "updateDraggingBoxesToFreeAxes",
// 		//               on: {
// 		//                 EXITED_SHIFT_MODE: { to: "freeAxes" },
// 		//               },
// 		//             },
// 		//           },
// 		//         },
// 		//       },
// 		//     },
// 		//     resizingBoxes: {
// 		//       on: {
// 		//         CANCELLED: { do: "restoreInitialBoxes", to: "selectedIdle" },
// 		//         RAISED_POINTER: { do: "completeSelectedBoxes" },
// 		//       },
// 		//       initial: "edgeResizing",
// 		//       states: {
// 		//         edgeResizing: {
// 		//           on: {
// 		//             MOVED_POINTER: { do: "cornerResizeSelectedBoxes" },
// 		//             SCROLLED: { do: "cornerResizeSelectedBoxes" },
// 		//           },
// 		//         },
// 		//         cornerResizing: {
// 		//           on: {
// 		//             MOVED_POINTER: { do: "edgeResizeSelectedBoxes" },
// 		//             SCROLLED: { do: "edgeResizeSelectedBoxes" },
// 		//           },
// 		//           initial: "freeRatio",
// 		//           states: {
// 		//             freeRatio: {
// 		//               onEnter: "updateResizingBoxesToLockedRatio",
// 		//               on: {
// 		//                 ENTERED_SHIFT_MODE: { to: "lockedRatio" },
// 		//               },
// 		//             },
// 		//             lockedRatio: {
// 		//               onEnter: "updateResizingBoxesToFreeRatio",
// 		//               on: {
// 		//                 EXITED_SHIFT_MODE: { to: "freeRatio" },
// 		//               },
// 		//             },
// 		//           },
// 		//         },
// 		//       },
// 		//     },
// 		//     creatingArrow: {
// 		//       initial: "drawingArrow",
// 		//       on: {},
// 		//       states: {
// 		//         drawingArrow: {},
// 		//         pickingArrow: {},
// 		//       },
// 		//     },
// 		//   },
// 		// },
// 		// drawingBox: {
// 		//   on: {
// 		//     CANCELLED: { to: "selected" },
// 		//   },
// 		//   initial: "notDrawing",
// 		//   states: {
// 		//     notDrawing: {},
// 		//   },
// 		// },
// 		// pickingArrow: {
// 		//   initial: "choosingFrom",
// 		//   on: {
// 		//     CANCELLED: { to: "selected" },
// 		//   },
// 		//   states: {
// 		//     choosingFrom: {},
// 		//     choosingTo: {},
// 		//   },
// 		// },
// 	// },
// 	// results: {
// 	// 	brushSelectingBoxes(data) {
// 	// 		const { camera, pointer, viewBox } = data

// 	// 		const results = selecter
// 	// 			? selecter(viewBoxToCamera(pointer, viewBox, camera))
// 	// 			: []

// 	// 		return results
// 	// 	},
// 	// },
// 	// conditions: {
// 	// 	distanceIsFarEnough(data) {
// 	// 		const { initial } = steady
// 	// 		const { pointer } = data
// 	// 		const dist = Math.hypot(
// 	// 			pointer.x - initial.pointer.x,
// 	// 			pointer.y - initial.pointer.y
// 	// 		)
// 	// 		return dist > 4
// 	// 	},
// 	// 	boxIsSelected(data, id: string) {
// 	// 		return data.selectedBoxIds.includes(id)
// 	// 	},
// 	// 	selectionHasChanged(data, _, ids: string[]) {
// 	// 		return ids.length !== data.selectedBoxIds.length
// 	// 	},
// 	// 	isInShiftMode() {
// 	// 		return pressedKeys.Shift
// 	// 	},
// 	// 	hasSelected(data) {
// 	// 		return data.selectedBoxIds.length > 0
// 	// 	},
// 	// },
// 	// actions: {
// 	// 	// Pointer ------------------------
// 	// 	// updatePointerOnPan(data, delta: IPoint) {
// 	// 	// 	const { pointer, viewBox, camera } = data
// 	// 	// 	pointer.dx = delta.x / camera.zoom
// 	// 	// 	pointer.dy = delta.y / camera.zoom
// 	// 	// 	pointerState.send("MOVED_POINTER", {
// 	// 	// 		screen: { ...pointer },
// 	// 	// 		document: viewBoxToCamera(pointer, viewBox, camera),
// 	// 	// 	})
// 	// 	// },
// 	// 	// updatePointerOnPointerMove(data, point: IPoint) {
// 	// 	// 	if (!point) return // Probably triggered by a zoom / scroll
// 	// 	// 	const { camera, viewBox, pointer } = data
// 	// 	// 	pointer.dx = (point.x - pointer.x) / camera.zoom
// 	// 	// 	pointer.dy = (point.y - pointer.y) / camera.zoom
// 	// 	// 	pointer.x = point.x
// 	// 	// 	pointer.y = point.y
// 	// 	// 	pointerState.send("MOVED_POINTER", {
// 	// 	// 		screen: { ...pointer },
// 	// 	// 		document: viewBoxToCamera(pointer, viewBox, camera),
// 	// 	// 	})
// 	// 	// },
// 	// 	setInitialPointer(data) {
// 	// 		const { initial } = steady
// 	// 		const { pointer, viewBox, camera } = data
// 	// 		initial.pointer = viewBoxToCamera(pointer, viewBox, camera)
// 	// 	},

// 	// 	// Camera -------------------------
// 	// 	// updateCameraZoom(data, change = 0) {
// 	// 	// 	const { camera, viewBox, pointer } = data
// 	// 	// 	const prev = camera.zoom
// 	// 	// 	const next = clamp(prev - change, 0.25, 100)
// 	// 	// 	const delta = next - prev
// 	// 	// 	camera.zoom = next
// 	// 	// 	camera.x += ((camera.x + pointer.x) * delta) / prev
// 	// 	// 	camera.y += ((camera.y + pointer.y) * delta) / prev

// 	// 	// 	viewBox.document.x = camera.x / camera.zoom
// 	// 	// 	viewBox.document.y = camera.y / camera.zoom
// 	// 	// 	viewBox.document.width = viewBox.width / camera.zoom
// 	// 	// 	viewBox.document.height = viewBox.height / camera.zoom
// 	// 	// },
// 	// 	// updateCameraPoint(data, delta: IPoint) {
// 	// 	// 	const { camera, viewBox } = data
// 	// 	// 	camera.x += delta.x
// 	// 	// 	camera.y += delta.y
// 	// 	// 	viewBox.document.x += delta.x / camera.zoom
// 	// 	// 	viewBox.document.y += delta.y / camera.zoom
// 	// 	// },
// 	// 	// updateCameraOnViewBoxChange(data, frame: IFrame) {
// 	// 	// 	const { viewBox, camera } = data
// 	// 	// 	if (viewBox.width > 0) {
// 	// 	// 		camera.x += (viewBox.width - frame.width) / 2
// 	// 	// 		camera.y += (viewBox.height - frame.height) / 2
// 	// 	// 		viewBox.document.x = camera.x
// 	// 	// 		viewBox.document.y = camera.y
// 	// 	// 		viewBox.document.width = viewBox.width / camera.zoom
// 	// 	// 		viewBox.document.height = viewBox.height / camera.zoom
// 	// 	// 	}
// 	// 	// },

// 	// 	// Viewbox ------------------------
// 	// 	// updateViewBox(data, frame: IFrame) {
// 	// 	// 	const { viewBox, camera } = data
// 	// 	// 	viewBox.x = frame.x
// 	// 	// 	viewBox.y = frame.y
// 	// 	// 	viewBox.width = frame.width
// 	// 	// 	viewBox.height = frame.height
// 	// 	// 	viewBox.document.x = camera.x
// 	// 	// 	viewBox.document.y = camera.y
// 	// 	// 	viewBox.document.width = viewBox.width / camera.zoom
// 	// 	// 	viewBox.document.height = viewBox.height / camera.zoom
// 	// 	// },
// 	// 	// updateViewBoxOnScroll(data, point: IPoint) {
// 	// 	// 	const { viewBox } = data
// 	// 	// 	viewBox.x += viewBox.scrollX - point.x
// 	// 	// 	viewBox.y += viewBox.scrollY - point.y
// 	// 	// 	viewBox.scrollX = point.x
// 	// 	// 	viewBox.scrollY = point.y
// 	// 	// },

// 	// 	// Selection Brush ----------------
// 	// 	startBrush(data) {
// 	// 		const { boxes, initial } = steady
// 	// 		const { pointer, viewBox, camera } = data
// 	// 		const { x, y } = viewBoxToCamera(pointer, viewBox, camera)
// 	// 		steady.brush = {
// 	// 			x0: initial.pointer.x,
// 	// 			y0: initial.pointer.y,
// 	// 			x1: x,
// 	// 			y1: y,
// 	// 		}
// 	// 		selecter = getBoxSelecter(Object.values(boxes), { x, y })
// 	// 	},
// 	// 	startBrushWithWorker(data) {
// 	// 		const { boxes, initial } = steady
// 	// 		const { pointer, viewBox, camera } = data
// 	// 		const { x, y } = viewBoxToCamera(pointer, viewBox, camera)
// 	// 		steady.brush = {
// 	// 			x0: initial.pointer.x,
// 	// 			y0: initial.pointer.y,
// 	// 			x1: x,
// 	// 			y1: y,
// 	// 		}

// 	// 		getFromWorker("selecter", {
// 	// 			origin: { x, y },
// 	// 		})
// 	// 	},
// 	// 	moveBrush(data) {
// 	// 		const { brush } = steady
// 	// 		const { pointer, viewBox, camera } = data
// 	// 		if (!brush) return
// 	// 		const point = viewBoxToCamera(pointer, viewBox, camera)
// 	// 		brush.x1 = point.x
// 	// 		brush.y1 = point.y
// 	// 	},
// 	// 	completeBrush(data) {
// 	// 		selecter = undefined
// 	// 		steady.brush = undefined
// 	// 	},

// 	// 	// Selection ----------------------
// 	// 	selectBox(data, payload = {}) {
// 	// 		const { id } = payload
// 	// 		data.selectedBoxIds = [id]
// 	// 	},
// 	// 	setSelectedIdsFromWorker() {
// 	// 		getFromWorker("selected", pointerState.data.document).then((r) => {
// 	// 			if (r.length !== state.data.selectedBoxIds.length) {
// 	// 				state.send("FORCED_IDS", r)
// 	// 			}
// 	// 		})
// 	// 	},
// 	// 	setSelectedIds(data, _, selectedBoxIds: string[]) {
// 	// 		data.selectedBoxIds = selectedBoxIds
// 	// 	},
// 	// 	clearSelection(data) {
// 	// 		data.selectedBoxIds = []
// 	// 		data.selectedArrowIds = []
// 	// 		steady.bounds = undefined
// 	// 	},
// 	// 	setInitialSelectedIds(data) {
// 	// 		steady.initial.selected.boxIds = [...data.selectedBoxIds]
// 	// 	},

// 	// 	// Boxes --------------------------
// 	// 	moveDraggingBoxes(data) {
// 	// 		const { pointer } = data

// 	// 		for (let id of data.selectedBoxIds) {
// 	// 			const box = steady.boxes[id]
// 	// 			box.x += pointer.dx
// 	// 			box.y += pointer.dy
// 	// 		}
// 	// 	},

// 	// 	// Bounds -------------------------
// 	// 	moveBounds(data) {
// 	// 		const { bounds } = steady
// 	// 		const { pointer } = data
// 	// 		if (!bounds) return
// 	// 		bounds.x += pointer.dx
// 	// 		bounds.y += pointer.dy
// 	// 		bounds.maxX = bounds.x + bounds.width
// 	// 		bounds.maxY = bounds.y + bounds.height
// 	// 	},
// 	// 	// updateBounds(data) {
// 	// 	// 	const { selectedBoxIds } = data
// 	// 	// 	if (selectedBoxIds.length === 0) steady.bounds = undefined
// 	// 	// 	steady.bounds = getBoundingBox(
// 	// 	// 		data.selectedBoxIds.map((id) => steady.boxes[id])
// 	// 	// 	)
// 	// 	// },
// 	// 	// setEdgeResizer(data, edge: number) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	steady.bounds = getBoundingBox(selectedBoxes)
// 	// 	// 	resizer = BoxTransforms.getEdgeResizer(selectedBoxes, steady.bounds, edge)
// 	// 	// },
// 	// 	// setCornerResizer(data, corner: number) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	steady.bounds = getBoundingBox(selectedBoxes)
// 	// 	// 	resizer = BoxTransforms.getCornerResizer(
// 	// 	// 		selectedBoxes,
// 	// 	// 		steady.bounds,
// 	// 	// 		corner
// 	// 	// 	)
// 	// 	// },
// 	// 	resizeBounds(data) {
// 	// 		const { bounds, boxes } = steady
// 	// 		const { pointer, viewBox, camera, selectedBoxIds } = data
// 	// 		const selectedBoxes = selectedBoxIds.map((id) => boxes[id])
// 	// 		if (!bounds) return
// 	// 		const point = viewBoxToCamera(pointer, viewBox, camera)
// 	// 		resizer && resizer(point, selectedBoxes, bounds)
// 	// 	},

// 	// 	// Undo / Redo --------------------
// 	// 	saveUndoState(data) {
// 	// 		const { boxes, arrows } = steady
// 	// 		const { selectedBoxIds, selectedArrowIds } = data

// 	// 		getFromWorker("updateTree", {
// 	// 			boxes: Object.values(boxes),
// 	// 		})

// 	// 		const current = JSON.stringify({
// 	// 			boxes,
// 	// 			arrows,
// 	// 			selectedBoxIds,
// 	// 			selectedArrowIds,
// 	// 		})
// 	// 		redos.length = 0
// 	// 		undos.push(current)
// 	// 		saveToDatabase(current)
// 	// 	},
// 	// 	loadUndoState(data) {
// 	// 		const { boxes, arrows } = steady
// 	// 		const { selectedBoxIds, selectedArrowIds } = data
// 	// 		const current = JSON.stringify({
// 	// 			boxes,
// 	// 			arrows,
// 	// 			selectedBoxIds,
// 	// 			selectedArrowIds,
// 	// 		})
// 	// 		redos.push(JSON.stringify(current))
// 	// 		const undo = undos.pop()
// 	// 		if (!undo) return

// 	// 		const json = JSON.parse(undo)
// 	// 		Object.assign(data, json)
// 	// 		saveToDatabase(JSON.stringify(undo))
// 	// 	},
// 	// 	loadRedoState(data) {
// 	// 		const redo = undos.pop()
// 	// 		if (!redo) return

// 	// 		const json = JSON.parse(redo)
// 	// 		Object.assign(data, json)
// 	// 		saveToDatabase(JSON.stringify(redo))
// 	// 	},
// 	// 	saveToDatabase(data) {
// 	// 		const { boxes, arrows } = steady
// 	// 		const { selectedBoxIds, selectedArrowIds } = data
// 	// 		const current = {
// 	// 			boxes,
// 	// 			arrows,
// 	// 			selectedBoxIds,
// 	// 			selectedArrowIds,
// 	// 		}
// 	// 		saveToDatabase(JSON.stringify(current))
// 	// 	},
// 	// 	// Boxes --------------------------
// 	// 	setInitialSnapshot(data) {
// 	// 		const { boxes } = steady
// 	// 		const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])

// 	// 		if (selectedBoxes.length === 0) {
// 	// 			steady.initial.boxes = {}
// 	// 			steady.bounds = undefined
// 	// 		}

// 	// 		const bounds = getBoundingBox(selectedBoxes)

// 	// 		let initialBoxes = {}

// 	// 		for (let box of selectedBoxes) {
// 	// 			initialBoxes[box.id] = {
// 	// 				id: box.id,
// 	// 				x: box.x,
// 	// 				y: box.y,
// 	// 				width: box.width,
// 	// 				height: box.height,
// 	// 				nx: (box.x - bounds.x) / bounds.width,
// 	// 				ny: (box.y - bounds.y) / bounds.height,
// 	// 				nmx: (box.x + box.width - bounds.x) / bounds.width,
// 	// 				nmy: (box.y + box.height - bounds.y) / bounds.height,
// 	// 				nw: box.width / bounds.width,
// 	// 				nh: box.height / bounds.height,
// 	// 			}
// 	// 		}

// 	// 		steady.initial.boxes = initialBoxes
// 	// 		steady.bounds = bounds
// 	// 	},
// 	// 	// alignSelectedBoxesLeft(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.alignBoxesLeft(selectedBoxes)
// 	// 	// },
// 	// 	// alignSelectedBoxesRight(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.alignBoxesRight(selectedBoxes)
// 	// 	// },
// 	// 	// alignSelectedBoxesTop(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.alignBoxesTop(selectedBoxes)
// 	// 	// },
// 	// 	// alignSelectedBoxesBottom(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.alignBoxesBottom(selectedBoxes)
// 	// 	// },
// 	// 	// alignSelectedBoxesCenterX(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.alignBoxesCenterX(selectedBoxes)
// 	// 	// },
// 	// 	// alignSelectedBoxesCenterY(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.alignBoxesCenterY(selectedBoxes)
// 	// 	// },
// 	// 	// distributeSelectedBoxesX(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.distributeBoxesX(selectedBoxes)
// 	// 	// },
// 	// 	// distributeSelectedBoxesY(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.distributeBoxesY(selectedBoxes)
// 	// 	// },
// 	// 	// stretchSelectedBoxesX(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.stretchBoxesX(selectedBoxes)
// 	// 	// },
// 	// 	// stretchSelectedBoxesY(data) {
// 	// 	// 	const { boxes } = steady
// 	// 	// 	const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 	// 	BoxTransforms.stretchBoxesY(selectedBoxes)
// 	// 	// },
// 	// 	deleteSelected(data) {
// 	// 		const { arrows, boxes } = steady
// 	// 		for (let id of data.selectedBoxIds) {
// 	// 			for (let arrow of Object.values(arrows)) {
// 	// 				if (arrow.to === id || arrow.from === id) {
// 	// 					delete arrows[arrow.id]
// 	// 				}
// 	// 			}
// 	// 			delete boxes[id]
// 	// 		}
// 	// 		data.selectedBoxIds.length = 0
// 	// 	},
// 	// 	// updateResizingBoxesToFreeRatio() {},
// 	// 	// updateResizingBoxesToLockedRatio() {},
// 	// 	// updateDraggingBoxesToFreeAxes() {},
// 	// 	// updateDraggingBoxesToLockedAxes() {},
// 	// 	restoreInitialBoxes() {},
// 	// 	completeSelectedBoxes() {},
// 	// 	// Drawing Arrow
// 	// 	createDrawingArrow() {},
// 	// 	setDrawingArrowTarget() {},
// 	// 	completeDrawingArrow() {},
// 	// 	clearDrawingArrow() {},
// 	// 	// Arrows
// 	// 	updateSelectedArrows() {},
// 	// 	flipSelectedArrows() {},
// 	// 	invertSelectedArrows() {},
// 	// 	// Arrows to Boxes
// 	// 	oxes() {},
// 	// 	flipArrowsToSelectedBoxes() {},
// 	// 	invertArrowsToSelectedBoxes() {},
// 	// 	// Drawing Box
// 	// 	setBoxOrigin(data) {
// 	// 		const { pointer, viewBox, camera } = data
// 	// 		steady.initial.pointer = viewBoxToCamera(pointer, viewBox, camera)
// 	// 	},
// 	// 	createDrawingBox(data) {
// 	// 		const { boxes, spawning, initial } = steady
// 	// 		const { pointer } = data
// 	// 		spawning.boxes = {
// 	// 			drawingBox: {
// 	// 				id: getId(),
// 	// 				x: Math.min(pointer.x, initial.pointer.x),
// 	// 				y: Math.min(pointer.y, initial.pointer.y),
// 	// 				width: Math.abs(pointer.x - initial.pointer.x),
// 	// 				height: Math.abs(pointer.y - initial.pointer.y),
// 	// 				label: "",
// 	// 				color: "#FFF",
// 	// 				z: Object.keys(boxes).length + 1,
// 	// 			},
// 	// 		}
// 	// 	},
// 	// 	updateDrawingBox(data) {
// 	// 		const { spawning, initial } = steady
// 	// 		const { pointer, viewBox, camera } = data
// 	// 		const box = spawning.boxes.drawingBox
// 	// 		if (!box) return
// 	// 		const { x, y } = viewBoxToCamera(pointer, viewBox, camera)
// 	// 		box.x = Math.min(x, initial.pointer.x)
// 	// 		box.y = Math.min(y, initial.pointer.y)
// 	// 		box.width = Math.abs(x - initial.pointer.x)
// 	// 		box.height = Math.abs(y - initial.pointer.y)
// 	// 	},
// 	// 	completeDrawingBox(data) {
// 	// 		const { boxes, spawning } = steady
// 	// 		const box = spawning.boxes.drawingBox
// 	// 		if (!box) return
// 	// 		boxes[box.id] = box
// 	// 		spawning.boxes = {}
// 	// 		data.selectedBoxIds = [box.id]
// 	// 	},
// 	// 	clearDrawingBox() {},
// 	// 	// Boxes

// 	// 	// Clones
// 	// 	clearDraggingBoxesClones() {},
// 	// 	createDraggingBoxesClones() {},
// 	// 	completeBoxesFromClones() {},
// 	// 	// Debugging
// 	// 	resetBoxes(data, count) {
// 	// 		const boxes = Array.from(Array(parseInt(count))).map((_, i) => ({
// 	// 			id: "box_a" + i,
// 	// 			x: -1500 + Math.random() * 3000,
// 	// 			y: -1500 + Math.random() * 3000,
// 	// 			width: 32 + Math.random() * 64,
// 	// 			height: 32 + Math.random() * 64,
// 	// 			label: "",
// 	// 			color: "#FFF",
// 	// 			z: i,
// 	// 		}))

// 	// 		const arrows = boxes.map((boxA, i) => {
// 	// 			let boxB = boxes[i === boxes.length - 1 ? 0 : i + 1]

// 	// 			return {
// 	// 				id: "arrow_b" + i,
// 	// 				type: IArrowType.BoxToBox,
// 	// 				from: boxA.id,
// 	// 				to: boxB.id,
// 	// 				flip: false,
// 	// 				label: "",
// 	// 			}
// 	// 		})

// 	// 		steady.boxes = boxes.reduce((acc, cur) => {
// 	// 			acc[cur.id] = cur
// 	// 			return acc
// 	// 		}, {})

// 	// 		steady.arrows = arrows.reduce((acc, cur) => {
// 	// 			acc[cur.id] = cur
// 	// 			return acc
// 	// 		}, {})

// 	// 		data.selectedBoxIds = []
// 	// 		data.selectedArrowIds = []

// 	// 		getFromWorker("updateTree", {
// 	// 			boxes: Object.values(boxes),
// 	// 		})
// 	// 	},
// 	// },
// 	// asyncs: {
// 	// 	async stretchSelectedBoxesX(data) {
// 	// 		const { boxes } = steady
// 	// 		const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 		const next = await getFromWorker("stretchBoxesX", selectedBoxes)

// 	// 		for (let box of next) {
// 	// 			steady.boxes[box.id] = box
// 	// 		}
// 	// 	},
// 	// 	async stretchSelectedBoxesY(data) {
// 	// 		const { boxes } = steady
// 	// 		const selectedBoxes = data.selectedBoxIds.map((id) => boxes[id])
// 	// 		const next = await getFromWorker("stretchBoxesY", selectedBoxes)

// 	// 		for (let box of next) {
// 	// 			steady.boxes[box.id] = box
// 	// 		}
// 	// 	},
// 	// },
// 	// values: {
// 	// 	undosLength() {
// 	// 		return undos.length
// 	// 	},
// 	// 	redosLength() {
// 	// 		return redos.length
// 	// 	},
// 	// 	boundingBox(data) {},
// 	// },
// })

// export default state

// state.onUpdate((update) => console.log(state.active))

// const actionHandler = (stateAtom, func) => {
// 	return atom(null, (get, set, { payload, type }) => {
// 		func({
// 			state: get(stateAtom),
// 			get,
// 			set,
// 			payload,
// 			type,
// 			ifTrue: (atom: any, func) => {
// 				if (get(atom)) {
// 					func()
// 				}
// 			},
// 			ifNotTrue: (atom: any, func) => {
// 				if (!get(atom)) {
// 					func()
// 				}
// 			},
// 			do: (atom: WritableAtom<any, any>, payload?: any) => set(atom, payload),
// 			to: (newState: string) => set(stateAtom, newState),
// 		})
// 	})
// }
