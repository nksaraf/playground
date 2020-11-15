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

export default function Tavern() {
	useWindowEvents()
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

// body {
// 	font-family: Nunito, sans-serif;
// 	color: #323232;
// 	line-height: 20px;
// 	font-size: 14px;
// 	font-weight: 600;
// 	text-rendering: optimizeLegibility;
// 	-webkit-font-smoothing: antialiased;
// 	-moz-font-smoothing: antialiased;
// }

function Container({ children }) {
	const { ref } = useViewBox()

	return (
		<div
			ref={ref}
			className="w-screen h-screen relative bg-gray-200"
			style={{ fontFamily: "Nunito, sans-serif" }}
		>
			{children}
		</div>
	)
}
