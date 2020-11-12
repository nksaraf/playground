import * as React from "react"
import { styled } from "./theme"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox, { useMachine } from "./hooks/useViewBox"

import Toolbar from "./toolbar/toolbar"
import ZoomIndicator from "./overlays/zoom-indicator"
import Overlays from "./overlays/overlays"
import { exampleGraph, writeGraph } from "./state/graph-io"
import { useAtom, useUpdateAtom } from "./state/atom"
import { scene } from "./state/scene"
import Br from "./canvas-tavern/brush"

const Container = styled.div({
	width: "100vw",
	height: "100vh",
	position: "absolute",
	top: 0,
	left: 0,
})

export default function App() {
	const state = useMachine()
	const { ref, width, height } = useViewBox()

	useWindowEvents()
	useKeyboardEvents()

	const write = useUpdateAtom(writeGraph)
	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	return (
		<Container ref={ref}>
			{/* <Canvas width={width} height={height} style={{ userSelect: "none" }} /> */}
			<SvgWrapper>
				<Brush />
			</SvgWrapper>
			<Overlays />
			<ZoomIndicator />
			<Toolbar />
		</Container>
	)
}

function SvgWrapper({ children }) {
	const state = useMachine()
	function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
		const { deltaX, deltaY } = e

		if (e.ctrlKey) {
			// Zooming
			state.send("ZOOMED", deltaY / 100)
			state.send("MOVED_POINTER")
		} else {
			// Panning
			state.send("PANNED", {
				x: deltaX,
				y: deltaY,
			})
			state.send("MOVED_POINTER")
		}
	}
	const [viewBoxSize] = useAtom(scene.viewBoxSize)
	const [{ x, y, zoom }] = useAtom(scene.camera)
	return (
		<svg
			onWheel={handleWheel}
			style={{ height: "100%", width: "100%", userSelect: "none" }}
			viewBox={`${0} ${0} ${viewBoxSize.width} ${viewBoxSize.height}`}
		>
			<g
				transform={`scale(${zoom}) translate(${-x / zoom} ${-y / zoom}) `}
				strokeWidth={1 / zoom}
			>
				{children}
			</g>
		</svg>
	)
}

function Brush() {
	const [brush] = useAtom(scene.brush)

	return brush ? <Br {...brush} /> : null
}
