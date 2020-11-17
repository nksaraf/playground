import * as React from "react"

import useKeyboardEvents from "../hooks/useKeyboardEvents"
import useWindowEvents from "../hooks/useWindowEvents"
import useViewBox from "../hooks/useViewBox"

import { Toolbar } from "./toolbar/toolbar"
import { useAtom } from "../lib/atom"
import { Canvas } from "./canvas/Canvas"
import { stateTree } from "../state"
import { renderState } from "../lib/logger"
import { snapshot } from "../state/snapshot"
import { TavernRoot } from "../state/storage"
import { Overlays } from "./overlays/Overlays"

export default function App() {
	return (
		<TavernRoot>
			<FullScreenContainer>
				<Canvas />
				<Toolbar />
				<Overlays />
				<StateDevtools />
			</FullScreenContainer>
		</TavernRoot>
	)
}

function StateDevtools() {
	const [activeStateTree] = useAtom(stateTree)
	const [graphSnapshot] = useAtom(snapshot.graphSnapshot)

	React.useEffect(() => {
		renderState({ stateTree: activeStateTree })
		console.log(graphSnapshot)
	}, [activeStateTree])

	return null
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
