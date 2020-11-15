import * as React from "react"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import { Toolbar } from "./components/toolbar/toolbar"
import { ZoomIndicator } from "./components/overlays/zoom-indicator"
import { Positions } from "./components/overlays/positions"
import { exampleGraph, writeGraph } from "./lib/graph-io"
import { useUpdateAtom } from "./atom"
import { Canvas } from "./components/canvas/Canvas"
import { useMachine } from "./state"

export default function Tavern() {
	useKeyboardEvents()

	const write = useUpdateAtom(writeGraph)
	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	return (
		<Container>
			<Canvas />
			<Positions />
			<ZoomIndicator />
			<Toolbar />
		</Container>
	)
}

function Container({ children }) {
	const { ref } = useViewBox()
	useWindowEvents()
	const state = useMachine()

	return (
		<div
			ref={ref}
			// onMouseMove={(e) => {
			// 	state.send("POINTER_MOVE", { x: e.clientX, y: e.clientY })
			// }}
			// onMouseDown={(e) => {
			// 	state.send("POINTER_UP", { x: e.clientX, y: e.clientY })
			// }}
			// onMouseUp={(e) => {
			// 	state.send("POINTER_DOWN", { x: e.clientX, y: e.clientY })
			// }}
			// onScroll={() => {
			// 	state.send("SCROLLED_VIEWPORT", {
			// 		x: window.scrollX,
			// 		y: window.scrollY,
			// 	})
			// }}
			className="w-screen h-screen relative bg-gray-200"
			style={{ fontFamily: "Nunito, sans-serif" }}
		>
			{children}
		</div>
	)
}
