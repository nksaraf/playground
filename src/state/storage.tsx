import * as React from "react"
import { MutableSnapshot, RecoilRoot, RecoilState } from "recoil"
import { useSaveToStorage } from "../hooks/useSaveToStorage"
import { scene } from "./scene"
import { selector } from "./selector"
import { snapshot } from "./snapshot"

export const withAtomsFromLocalStorage = (
	...items: { key: string; defaultValue: any; atom: RecoilState<any> }[]
) => {
	const components = items.map((it) => {
		return function SaverComponent() {
			useSaveToStorage(it.key, it.atom)
			return null
		}
	})
	const initializeAtoms = (mutat: MutableSnapshot) => {
		items.forEach((it) => {
			mutat.set(
				it.atom,
				JSON.parse(
					localStorage.getItem(it.key) ?? JSON.stringify(it.defaultValue)
				)
			)
		})
	}

	function Saver() {
		return (
			<>
				{components.map((SaverComp) => (
					<SaverComp />
				))}
			</>
		)
	}

	return function Root({ children }) {
		return (
			<RecoilRoot initializeState={initializeAtoms}>
				{children}
				<Saver />
			</RecoilRoot>
		)
	}
}

export const TavernRoot = withAtomsFromLocalStorage(
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
