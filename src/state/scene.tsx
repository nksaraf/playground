import { atom } from "../atom/atom"
import { IPoint } from "../../types"
import { RecoilState } from "recoil"

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

const brush = atom((get) => {
	const start = get(brushStart)
	const end = get(brushEnd)

	if (start && end) {
		return { x0: start.x, y0: start.y, x1: end.x, y1: end.y }
	} else {
		return null
	}
})

type ValueOf<T> = T extends RecoilState<infer U> ? U : null

const lastPointState = atom(
	null as {
		screenPointer: IPoint
		documentPointer: IPoint
		camera: ValueOf<typeof camera>
		viewBox: ValueOf<typeof viewBox>
	} | null
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
	documentViewBoxPosition,
	documentViewBoxSize,
	documentViewBox,
	screenPointerPosition,
	screenPointerDelta,
	screenPointer,
	documentPointer,
	brushStart,
	brushEnd,
	brush,
}
