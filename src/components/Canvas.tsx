import * as React from "react"
import { useMachine } from "../hooks/useMachine"
import { SvgCanvas } from "./SvgCanvas"
import { SelectionBrush } from "./SelectionBrush"
import { CanvasBackground } from "./CanvasBackground"
import { useAtom } from "../atom"
import { Connection } from "./Connection"
import { graph, scene, selector } from "../state"
import { Node } from "./Node"

export function useWheel() {
	const state = useMachine()
	return React.useCallback(
		(e: React.WheelEvent) => {
			const { deltaX, deltaY } = e

			if (e.ctrlKey) {
				// Zooming
				state.send("ZOOMED", deltaY / 100)
				state.send("MOVED_POINTER")
			} else {
				// Panning
				state.send("PANNED", {
					x: deltaX,
					y: deltaY,
				})
				state.send("MOVED_POINTER")
			}
		},
		[state.send]
	)
}

export function Canvas({ width, height }) {
	const handleWheel = useWheel()
	const machine = useMachine()

	return (
		<div
			className="relative overflow-x-hidden overflow-y-hidden"
			style={{ height, width, userSelect: "none" }}
			onMouseDown={(e) => {
				machine.send("STARTED_POINTING_CANVAS", {
					x: e.clientX,
					y: e.clientY,
				})
			}}
			onMouseUp={(e) =>
				machine.send("STOPPED_POINTING", { x: e.clientX, y: e.clientY })
			}
			onWheel={handleWheel}
		>
			<SvgCanvas height={height} width={width}>
				<SelectionBrush />
				<NewComponentGhost />
				<Connections />
			</SvgCanvas>
			<CanvasBackground height={height} width={width}>
				<Nodes />
			</CanvasBackground>
		</div>
	)
}

function NewComponentGhost() {
	const [state] = useAtom(selector.selectToolState)
	const [pointer] = useAtom(scene.documentPointer)

	return state === "inserting" ? (
		<rect
			x={pointer.x}
			y={pointer.y}
			width={20}
			height={20}
			fill="rgba(0,0,100, .1)"
			stroke="rgba(0,0,100, .2)"
			strokeWidth={1}
		/>
	) : null
}

export const Connections = React.memo(() => {
	const [allConnectionIDs] = useAtom(graph.connectionIDs)

	return (
		<>
			{allConnectionIDs.map((id) => {
				return <Connection connectionID={id} key={id} />
			})}
		</>
	)
})

export const Nodes = React.memo(() => {
	const [nodeIDs] = useAtom(graph.nodeIDs)

	return (
		<>
			{nodeIDs.map((id) => {
				return <Node nodeID={id} key={id} />
			})}
		</>
	)
})
