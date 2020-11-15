import * as React from "react"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import Toolbar from "./components/toolbar/toolbar"
import ZoomIndicator from "./components/overlays/zoom-indicator"
import Overlays from "./components/overlays/overlays"
import { exampleGraph, writeGraph } from "./lib/graph-io"
import { useUpdateAtom } from "./atom"
import { Canvas } from "./components/Canvas"

export default function App() {
	useWindowEvents()
	useKeyboardEvents()

	const write = useUpdateAtom(writeGraph)
	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	return (
		<Container>
			<Canvas />
			<Overlays />
			<ZoomIndicator />
			<Toolbar />
		</Container>
	)
}

function Container({ children }) {
	const { ref, width, height } = useViewBox()

	return (
		<div ref={ref} className="w-screen h-screen absolue t-0 l-0">
			{children}
		</div>
	)
}
