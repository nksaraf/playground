import * as React from "react"

import useKeyboardEvents from "../hooks/useKeyboardEvents"
import useWindowEvents from "../hooks/useWindowEvents"
import useViewBox from "../hooks/useViewBox"

import { Toolbar } from "./toolbar/toolbar"
import { ZoomIndicator } from "./overlays/ZoomIndicator"
import { Positions } from "./overlays/Positions"
import { useAtom } from "../lib/atom"
import { Canvas } from "./canvas/Canvas"
import {
	MutableSnapshot,
	RecoilRoot,
	RecoilState,
	useRecoilCallback,
} from "recoil"
import { scene, selector, stateTree } from "../state"
import { renderState } from "../lib/logger"
import { snapshot } from "../state/snapshot"
import { SelectedNodes } from "./overlays/SelectedNodes"
import { useSaveToStorage } from "../hooks/useSaveToStorage"

const saveAtoms = (
	...items: { key: string; defaultValue: any; atom: RecoilState<any> }[]
) => {
	const components = items.map((it) => {
		return function SaverComponent() {
			useSaveToStorage(it.key, it.atom)
			return null
		}
	})
	return [
		(mutat: MutableSnapshot) => {
			items.forEach((it) => {
				mutat.set(
					it.atom,
					JSON.parse(
						localStorage.getItem(it.key) ?? JSON.stringify(it.defaultValue)
					)
				)
			})
		},
		function Saver() {
			return (
				<>
					{components.map((SaverComp) => (
						<SaverComp />
					))}
				</>
			)
		},
	] as const
}

const [initilizer, SaveState] = saveAtoms(
	{
		key: "tavern_graph_snapshot",
		defaultValue: { nodes: [], connections: [] },
		atom: snapshot.graphSnapshot,
	},
	{
		key: "tavern_scene",
		defaultValue: {
			camera: { x: 0, y: 0, zoom: 1 },
			viewBox: {
				size: { width: 0, height: 0 },
				position: { x: 0, y: 0 },
				scroll: { scrollX: 0, scrollY: 0 },
			},
		},
		atom: scene.sceneSnapshot,
	},
	{
		key: "tavern_selection",
		defaultValue: { nodeIDs: [], connectionIDs: [] },
		atom: selector.selectedSnapshot,
	}
)

export default function App() {
	return (
		<RecoilRoot
			initializeState={(mutable) => {
				initilizer(mutable)
			}}
		>
			<FullScreenContainer>
				<Canvas />
				<Positions />
				<ZoomIndicator />
				<Toolbar />
				<SelectedNodes />
				<SaveState />
				<StateDevtools />
			</FullScreenContainer>
		</RecoilRoot>
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
