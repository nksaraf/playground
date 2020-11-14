import * as React from "react"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import Toolbar from "./components/toolbar/toolbar"
import ZoomIndicator from "./components/overlays/zoom-indicator"
import Overlays from "./components/overlays/overlays"
import { exampleGraph, writeGraph } from "./state/graph-io"
import { useUpdateAtom } from "./atom/atom"
import { Canvas } from "./components/Canvas"

export default function App() {
	const { ref, width, height } = useViewBox()

	useWindowEvents()
	useKeyboardEvents()

	const write = useUpdateAtom(writeGraph)
	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	return (
		<div ref={ref} className="w-screen h-screen absolue t-0 l-0">
			<Canvas width={width} height={height} />
			<Overlays />
			<ZoomIndicator />
			<Toolbar />
		</div>
	)
}
