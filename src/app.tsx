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
	const [viewBoxSize] = useAtom(scene.viewBoxSize)
	const [{ x, y }] = useAtom(scene.cameraPosition)
	return (
		<svg
			style={{ height: "100%", width: "100%" }}
			viewBox={`${x} ${y} ${viewBoxSize.width} ${viewBoxSize.height}`}
		>
			{children}
		</svg>
	)
}

function Brush() {
	const [brushStart] = useAtom(scene.brushStart)
	const [brushEnd] = useAtom(scene.brushEnd)

	return brushStart ? (
		<Br x0={brushStart.x} y0={brushStart.y} x1={brushEnd.x} y1={brushEnd.y} />
	) : null
}
