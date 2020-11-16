import * as React from "react"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import { Toolbar } from "./components/toolbar/toolbar"
import { ZoomIndicator } from "./components/overlays/zoom-indicator"
import { Positions } from "./components/overlays/positions"
import { exampleGraph, writeGraph } from "./lib/graph-io"
import { useAtom, useUpdateAtom } from "./atom"
import { Canvas } from "./components/canvas/Canvas"
import {
	RecoilRoot,
	useRecoilCallback,
	useRecoilTransactionObserver_UNSTABLE,
} from "recoil"
import { graph, scene, selector } from "./state"

export default function App() {
	return (
		<RecoilRoot
			initializeState={(snapshot) => {
				snapshot.set(
					graph.snapshot,
					JSON.parse(
						localStorage.getItem("tavern_graph_snapshot") ??
							`{ "nodes": [], "connections": []}`
					)
				)

				snapshot.set(
					selector.selected,
					JSON.parse(
						localStorage.getItem("tavern_selection") ??
							`{ "nodeIDs": [], "connectionIDs": []}`
					)
				)
			}}
		>
			<FullScreenContainer>
				<Canvas />
				<Positions />
				<ZoomIndicator />
				<Toolbar />
				<GraphDevtools />
				<SelectedStateDevtools />
			</FullScreenContainer>
		</RecoilRoot>
	)
}

function GraphDevtools() {
	const saver = useRecoilCallback((cb) => async () => {
		localStorage.setItem(
			"tavern_graph_snapshot",
			JSON.stringify(cb.snapshot.getLoadable(graph.snapshot).contents)
		)
	})

	useAtom(graph.snapshot)

	React.useEffect(() => {
		saver()
	})

	return null
}

function SelectedStateDevtools() {
	const saver = useRecoilCallback((cb) => async () => {
		localStorage.setItem(
			"tavern_selection",
			JSON.stringify(cb.snapshot.getLoadable(selector.selected).contents)
		)
	})

	useAtom(selector.selected)

	React.useEffect(() => {
		saver()
	})

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
