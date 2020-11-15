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
import { RecoilRoot } from "recoil"

export default function App() {
	return (
		<RecoilRoot>
			<Tavern />
		</RecoilRoot>
	)
}

function Tavern() {
	useKeyboardEvents()
	const write = useUpdateAtom(writeGraph)

	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	return (
		<FullScreenContainer>
			<Canvas />
			<Positions />
			<ZoomIndicator />
			<Toolbar />
		</FullScreenContainer>
	)
}

function FullScreenContainer({
	children,
	className = "",
	style = {},
	...props
}) {
	const { ref } = useViewBox()
	useWindowEvents()

	return (
		<div
			ref={ref}
			className={`w-screen h-screen relative bg-gray-200 ${className}`}
			style={{ fontFamily: "Nunito, sans-serif", ...style }}
			{...props}
		>
			{children}
		</div>
	)
}
