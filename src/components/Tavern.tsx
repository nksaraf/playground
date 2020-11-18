import * as React from "react"

import useKeyboardEvents from "../hooks/useKeyboardEvents"
import useWindowEvents from "../hooks/useWindowEvents"
import useViewBox from "../hooks/useViewBox"

import { Toolbar } from "./toolbar/toolbar"
import { Canvas } from "./canvas/Canvas"
import { TavernRoot } from "../lib/storage"
import { Overlays } from "./overlays/Overlays"

export default function App() {
	return (
		<TavernRoot>
			<FullScreenContainer>
				<Canvas />
				<Toolbar />
				<Overlays />
			</FullScreenContainer>
		</TavernRoot>
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
	useKeyboardEvents()

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
