import * as React from "react"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import { Toolbar } from "./components/toolbar/toolbar"
import { ZoomIndicator } from "./components/overlays/zoom-indicator"
import { Positions } from "./components/overlays/positions"
import { exampleGraph, writeGraph } from "./lib/graph-io"
import { atom, useAtom, useUpdateAtom } from "./atom"
import { Canvas } from "./components/canvas/Canvas"
import {
	RecoilRoot,
	useRecoilCallback,
	useRecoilTransactionObserver_UNSTABLE,
} from "recoil"
import { graph, scene, selector, stateTree } from "./state"
import JsonOutput from "./components/devtools/JsonOutput"

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
				<StateDevtools />
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

const selectedNodeSnapshots = atom((get) =>
	get(selector.selectedNodeIDs).map((id) => get(graph.getNodeSnapshot(id)))
)

function SelectedStateDevtools() {
	const saver = useRecoilCallback((cb) => async () => {
		localStorage.setItem(
			"tavern_selection",
			JSON.stringify(cb.snapshot.getLoadable(selector.selected).contents)
		)
	})

	const [nodeAtoms] = useAtom(selectedNodeSnapshots)

	React.useEffect(() => {
		saver()
	})

	return (
		<div
			className="absolute font-mono text-xs bg-white rounded-xl p-3"
			style={{ minWidth: 240, top: 48, right: 8, "--bg-opacity": 0.45 }}
		>
			<JsonOutput
				value={nodeAtoms.length > 1 ? nodeAtoms : nodeAtoms[0]}
				property={nodeAtoms.length > 1 ? "nodes" : nodeAtoms[0].id}
			/>
		</div>
	)
}

import { renderState } from "./logger"

function StateDevtools() {
	const [at] = useAtom(stateTree)
	const [snapshot] = useAtom(graph.snapshot)

	React.useEffect(() => {
		renderState({ stateTree: at })
		console.log(snapshot)
	}, [at])

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
