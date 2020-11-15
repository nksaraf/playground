import * as React from "react"
import { useMachine } from "../hooks/useMachine"
import { SvgCanvas } from "./SvgCanvas"
import { SelectionBrush } from "./SelectionBrush"
import { useAtom } from "../atom"
import { Connection } from "./Connection"
import { activeState, graph, scene, selector } from "../state"
import { Node } from "./Node"

export function useWheel() {
	const state = useMachine()
	return React.useCallback(
		(e: React.WheelEvent) => {
			const { deltaX, deltaY } = e

			if (e.ctrlKey) {
				// Zooming
				state.send("ZOOMED", deltaY / 100)
				state.send("POINTER_MOVE")
			} else {
				// Panning
				state.send("PANNED", {
					x: deltaX,
					y: deltaY,
				})
				state.send("POINTER_MOVE")
			}
		},
		[state.send]
	)
}

export function Canvas() {
	const handleWheel = useWheel()
	const machine = useMachine()
	const [{ width, height }] = useAtom(scene.viewBoxSize)

	return (
		<div
			className="relative overflow-x-hidden overflow-y-hidden"
			style={{ height, width, userSelect: "none" }}
			onMouseDown={(e) => {
				machine.send("POINTER_DOWN_ON_CANVAS", {
					x: e.clientX,
					y: e.clientY,
				})
			}}
			onMouseUp={(e) =>
				machine.send("POINTER_UP", { x: e.clientX, y: e.clientY })
			}
			onWheel={handleWheel}
		>
			<SvgCanvas height={height} width={width}>
				<SelectionBrush />
				<InsertingComponentGhost />
				<Connections />
			</SvgCanvas>
			<CanvasBackground height={height} width={width}>
				<Nodes />
			</CanvasBackground>
		</div>
	)
}

export function CanvasBackground({ children, height, width }) {
	const [{ x, y, zoom }] = useAtom(scene.camera)
	return (
		<div
			className="absolute"
			style={{
				transform: `scale(${zoom}) translateX(${-x / zoom}px) translateY(${
					-y / zoom
				}px)`,
				transformOrigin: "0px 0px",
				height,
				width,
			}}
		>
			<div className="relative">{children} </div>
		</div>
	)
}

function InsertingComponentGhost() {
	const [state] = useAtom(activeState)
	const [pointer] = useAtom(scene.documentPointer)

	return state.includes("inserting") ? (
		<ComponentGhost x={pointer.x} y={pointer.y} />
	) : null
}

function ComponentGhost({ x, y }) {
	return (
		<rect
			x={x}
			y={y}
			width={20}
			height={20}
			fill="rgba(0,0,100, .1)"
			stroke="rgba(0,0,100, .2)"
			strokeWidth={1}
		/>
	)
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
