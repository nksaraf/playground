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
import { saveToDatabase } from "./database"
import { BoxSelecter, getBoxSelecter } from "./box-selecter"
import * as BoxTransforms from "./box-transforms"
import clamp from "lodash/clamp"
import uniqueId from "lodash/uniqueId"
import { v4 as uuid } from "uuid"
import flatten from "lodash/flatten"
import * as Comlink from "comlink"
import { graph } from "./graph"
import { scene } from "./scene"
import { Action } from "./selectToolState"

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

export const saveUndoState = atom(null, (get, set) => {
	const current = get(graph.snapshot)

	getFromWorker("updateTree", {
		boxes: current.nodes,
	})

	const commit = JSON.stringify(current)

	set(redoState, [])
	set(undoState, (undoSt) => [...undoSt, commit])
	saveToDatabase(commit)
})

export const loadUndoState = atom(null, (get, set) => {})

export const loadRedoState = atom(null, (get, set) => {})

export const updatePointerOnPointerMove = atom(
	null,
	(get, set, point: IPoint) => {
		if (!point) return // Probably triggered by a zoom / scroll

		const zoom = get(scene.cameraZoom)
		const oldPos = get(scene.screenPointerPosition)
		set(scene.screenPointerPosition, point)
		set(scene.screenPointerDelta, {
			dx: (point.x - oldPos.x) / zoom,
			dy: (point.y - oldPos.y) / zoom,
		})
	}
)

export const updatePointerOnPan = atom(null, (get, set, delta: IPoint) => {
	const zoom = get(scene.cameraZoom)
	set(scene.screenPointerDelta, { dx: delta.x / zoom, dy: delta.y / zoom })
})

export const updateCameraPoint = atom(null, (get, set, delta: IPoint) => {
	set(scene.cameraPosition, (pos) => ({
		x: pos.x + delta.x,
		y: pos.y + delta.y,
	}))
})

export const updateViewBoxOnScroll = atom(null, (get, set, point: IPoint) => {
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

export const updateCameraOnViewBoxChange = atom(
	null,
	(get, set, frame: IFrame) => {
		const viewBox = get(scene.viewBoxSize)
		if (viewBox.width > 0) {
			set(scene.cameraPosition, (pos) => ({
				x: pos.x + (viewBox.width - frame.width) / 2,
				y: pos.y + (viewBox.height - frame.height) / 2,
			}))
		}
	}
)

export const updateViewBox = atom(null, (get, set, frame: IFrame) => {
	set(scene.viewBoxPosition, { x: frame.x, y: frame.y })
	set(scene.viewBoxSize, { height: frame.height, width: frame.width })
})

export const updateCameraZoom = atom(null, (get, set, newZoom: number) => {
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

export const setPointer = atom(null, (get, set) => {
	set(scene.lastPointState, {
		screenPointer: get(scene.screenPointer),
		documentPointer: get(scene.documentPointer),
		viewBox: get(scene.viewBox),
		camera: get(scene.camera),
	})
})

export const clearSelection = atom(null, (get, set) => {
	set(graph.selectedConnectionIDs, [])
	set(graph.selectedNodeIDs, [])
})

export const deleteSelected = atom(null, (get, set) => {
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

export const startBrushWithWorker = atom(null, (get, set) => {
	const { x, y } = get(scene.documentPointer)

	const { documentPointer } = get(scene.lastPointState)
	set(scene.brushStart, { ...documentPointer })
	set(scene.brushEnd, { x, y })

	getFromWorker("selecter", {
		origin: { x, y },
	})
})

const initialSelectedNodeIDs = atom([])

export const setInitialSelectedIDs = atom(null, (get, set) => {
	set(initialSelectedNodeIDs, [...get(graph.selectedNodeIDs)])
})

export const moveBrush = atom(null, (get, set) => {
	set(scene.brushEnd, { ...get(scene.documentPointer) })
})

export const setSelectedIdsFromWorker = atom(null, (get, set) => {
	getFromWorker("selected", get(scene.documentPointer)).then((r) => {
		if (r.length !== get(graph.selectedNodeIDs).length) {
			set(graph.selectedNodeIDs, r)
		}
	})
})

export const completeBrush = atom(null, (get, set) => {
	set(scene.brushStart, null)
	set(scene.brushEnd, null)
})

export * from "./selectToolState"
export * from "./graph"
export * from "./scene"
export * from "./useMachine"
