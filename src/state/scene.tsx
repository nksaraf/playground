import { atom, ValueOf } from "../lib/atom"
import { IPoint } from "../../types"

import { IFrame } from "../../types"
import clamp from "lodash/clamp"

const cameraPosition = atom({
	x: 0,
	y: 0,
})

const cameraZoom = atom(1)

const camera = atom(
	(get) => ({
		...get(cameraPosition),
		zoom: get(cameraZoom),
	}),
	(get, set, { x, y, zoom }) => {
		set(cameraPosition, { x, y })
		set(cameraZoom, zoom)
	}
)

const viewBoxPosition = atom({
	x: 0,
	y: 0,
})

const viewBoxSize = atom({
	width: 0,
	height: 0,
})

const viewBoxScroll = atom({
	scrollX: 0,
	scrollY: 0,
})

const screenPointerPosition = atom({ x: 0, y: 0 })

const screenPointerDelta = atom({ dx: 0, dy: 0 })

const screenPointer = atom((get) => ({
	...get(screenPointerPosition),
	...get(screenPointerDelta),
}))

const documentPointer = atom((get) => {
	return {
		x:
			(get(cameraPosition).x +
				get(screenPointerPosition).x -
				get(viewBoxPosition).x) /
			get(cameraZoom),
		y:
			(get(cameraPosition).y +
				get(screenPointerPosition).y -
				get(viewBoxPosition).y) /
			get(cameraZoom),
	}
})

const documentViewBoxPosition = atom((get) => {
	const { zoom, x, y } = get(camera)
	return {
		x: x / zoom,
		y: y / zoom,
	}
})

const documentViewBoxSize = atom((get) => {
	const zoom = get(cameraZoom)
	const { width, height } = get(viewBoxSize)

	return {
		width: width / zoom,
		height: height / zoom,
	}
})

const documentViewBox = atom((get) => {
	return {
		...get(documentViewBoxSize),
		...get(documentViewBoxPosition),
	}
})

const viewBox = atom(
	(get) => ({
		position: get(viewBoxPosition),
		scroll: get(viewBoxScroll),
		size: get(viewBoxSize),
	}),
	(get, set, update) => {
		set(viewBoxPosition, update.position)
		set(viewBoxScroll, update.scroll)
		set(viewBoxSize, update.size)
	}
)

const lastPointState = atom(
	null as {
		screenPointer: IPoint
		documentPointer: IPoint
		camera: ValueOf<typeof camera>
		viewBox: ValueOf<typeof viewBox>
	} | null
)

const updatePointerOnPointerMove = atom(null, (get, set, point: IPoint) => {
	if (!point) return // Probably triggered by a zoom / scroll

	const zoom = get(cameraZoom)
	const oldPos = get(screenPointerPosition)
	set(screenPointerPosition, point)
	set(screenPointerDelta, {
		dx: (point.x - oldPos.x) / zoom,
		dy: (point.y - oldPos.y) / zoom,
	})
})

const updatePointerOnPan = atom(null, (get, set, delta: IPoint) => {
	const zoom = get(cameraZoom)
	set(screenPointerDelta, { dx: delta.x / zoom, dy: delta.y / zoom })
})

const updateCameraPoint = atom(null, (get, set, delta: IPoint) => {
	set(cameraPosition, (pos) => ({
		x: pos.x + delta.x,
		y: pos.y + delta.y,
	}))
})

const updateViewBoxOnScroll = atom(null, (get, set, point: IPoint) => {
	const { scrollX, scrollY } = get(viewBoxScroll)

	set(viewBoxPosition, (pos) => ({
		x: pos.x + scrollX - point.x,
		y: pos.y + scrollY - point.y,
	}))

	set(viewBoxScroll, {
		scrollX: point.x,
		scrollY: point.y,
	})
})

const updateCameraOnViewBoxChange = atom(null, (get, set, frame: IFrame) => {
	const viewBox = get(viewBoxSize)
	// if (viewBox.width > 0) {
	// 	// set(cameraPosition, (pos) => ({
	// 	// 	x: pos.x + (viewBox.width - frame.width) / 2,
	// 	// 	y: pos.y + (viewBox.height - frame.height) / 2,
	// 	// }))
	// }
})

const updateViewBox = atom(null, (get, set, frame: IFrame) => {
	set(viewBoxPosition, { x: frame.x, y: frame.y })
	set(viewBoxSize, { height: frame.height, width: frame.width })
})

const updateCameraZoom = atom(null, (get, set, newZoom: number) => {
	const prev = get(cameraZoom)
	const next = clamp(prev - newZoom, 0.25, 100)
	const delta = next - prev
	const pointer = get(screenPointerPosition)

	set(cameraZoom, next)
	set(cameraPosition, (pos) => ({
		x: pos.x + ((pos.x + pointer.x) * delta) / prev,
		y: pos.y + ((pos.y + pointer.y) * delta) / prev,
	}))
})

const savePointer = atom(null, (get, set) => {
	set(lastPointState, {
		screenPointer: get(screenPointer),
		documentPointer: get(documentPointer),
		viewBox: get(viewBox),
		camera: get(camera),
	})
})

const sceneSnapshot = atom(
	(get) => ({
		camera: get(camera),
		viewBox: get(viewBox),
	}),
	(get, set, update) => {
		set(camera, update.camera)
		set(viewBox, update.viewBox)
	}
)

export const scene = {
	cameraZoom,
	cameraPosition,
	camera,
	lastPointState,
	viewBox,
	viewBoxPosition,
	viewBoxSize,
	viewBoxScroll,
	sceneSnapshot,
	documentViewBoxPosition,
	documentViewBoxSize,
	documentViewBox,
	screenPointerPosition,
	screenPointerDelta,
	screenPointer,
	documentPointer,
	actions: {
		updatePointerOnPointerMove,
		updatePointerOnPan,
		updateCameraPoint,
		updateViewBoxOnScroll,
		updateCameraOnViewBoxChange,
		updateViewBox,
		updateCameraZoom,
		savePointer,
	},
}
