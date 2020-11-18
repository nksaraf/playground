import * as React from "react"
import { model, useMachine } from "../../state"
import { SvgCanvas } from "./SvgCanvas"
import { SelectionBrush } from "./SelectionBrush"
import { atom, useAtom } from "../../lib/atom"
import { Connection, Spline } from "./Connection"
import { machine, graph, scene, selector } from "../../state"
import { Node } from "../Node"
import { insertTool } from "../../state/machine/insert"

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
			style={{
				height,
				width,
				userSelect: "none",
				backgroundSize: "40px 40px",
				backgroundImage:
					"linear-gradient(to right, #f2f4f7 2px, transparent 1px), linear-gradient(to bottom, #f2f4f7 2px, transparent 1px)",
			}}
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
				<InsertingNodeGhost />
				<InsertingConnectortGhost />
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

function InsertingNodeGhost() {
	const [state] = useAtom(machine.activeState)
	const [pointer] = useAtom(scene.documentPointer)

	return state.includes("insertingComponent") ? (
		<ComponentGhost x={pointer.x} y={pointer.y} />
	) : null
}

const addingConnectorFromPin = atom((get) => {
	return {
		position: get(
			graph.getPinPosition(get(insertTool.addingConnectorFromPinID))
		),
		metadata: get(
			model.getPinMetadata(get(insertTool.addingConnectorFromPinID))
		),
	}
})

function InsertingConnectortGhost() {
	const [state] = useAtom(machine.activeState)
	const [connectorPin] = useAtom(addingConnectorFromPin)
	const [pointer] = useAtom(scene.documentPointer)
	const start =
		connectorPin.metadata.type === "output" ? connectorPin.position : pointer
	const end =
		connectorPin.metadata.type === "output" ? pointer : connectorPin.position

	return state.includes("insertingConnector") ? (
		<>
			<Spline start={start} end={end} className="connector" />
			<circle cx={pointer.x} cy={pointer.y} r={3} fill="#4299e1" />
		</>
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
	const [allConnectionIDs] = useAtom(model.connectionIDs)

	return (
		<>
			{allConnectionIDs.map((id) => {
				return <Connection connectionID={id} key={id} />
			})}
		</>
	)
})

export const Nodes = React.memo(() => {
	const [nodeIDs] = useAtom(model.nodeIDs)

	return (
		<>
			{nodeIDs.map((id) => {
				return <Node nodeID={id} key={id} />
			})}
		</>
	)
})
