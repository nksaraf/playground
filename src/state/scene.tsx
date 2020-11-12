import { atom } from "./atom"
import { IPoint } from "../../types"

const cameraPosition = atom({
	x: 0,
	y: 0,
})

const cameraZoom = atom(1)

const camera = atom((get) => ({
	...get(cameraPosition),
	zoom: get(cameraZoom),
}))

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

const viewBox = atom((get) => ({
	...get(viewBoxPosition),
	...get(viewBoxScroll),
	...get(viewBoxSize),
	document: get(documentViewBox),
}))

const brushStart = atom(null as null | IPoint)
const brushEnd = atom(null as null | IPoint)

export const scene = {
	cameraZoom,
	cameraPosition,
	camera,
	viewBox,
	viewBoxPosition,
	viewBoxSize,
	viewBoxScroll,
	screenPointerPosition,
	screenPointerDelta,
	screenPointer,
	documentPointer,
	documentViewBox,
	brushStart,
	brushEnd,
}
