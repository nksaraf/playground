import * as React from "react"
import { styled } from "./theme"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"
import { useMachine } from "./state/useMachine"

import Toolbar from "./toolbar/toolbar"
import ZoomIndicator from "./overlays/zoom-indicator"
import Overlays from "./overlays/overlays"
import { exampleGraph, writeGraph } from "./state/graph-io"
import { useAtom, useUpdateAtom } from "./state/atom"
import { scene } from "./state/scene"
import { graph } from "./state/graph"
import Brush from "./canvas-tavern/brush"
import { ControlledNode } from "./graph/Node"
import { machine } from "./state"

export default function App() {
	const { ref, width, height } = useViewBox()

	useWindowEvents()
	useKeyboardEvents()

	const write = useUpdateAtom(writeGraph)
	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	// console.log(useAtom(graph.snapshot))

	return (
		<div ref={ref} className="w-screen h-screen absolue t-0 l-0">
			<Canvas width={width} height={height} style={{ userSelect: "none" }} />
			<Overlays />
			<ZoomIndicator />
			<Toolbar />
		</div>
	)
}

function useWheel() {
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

function CanvasBackground({ children, height, width }) {
	const [{ x, y, zoom }] = useAtom(scene.camera)
	return (
		<div
			className="absolute"
			style={{
				transform: `scale(${zoom}) translateX(${-x / zoom}px) translateY(${
					-y / zoom
				}px)`,
				height,
				width,
			}}
		>
			<div className="relative">{children} </div>
		</div>
	)
}

function Canvas({ width, height, style }) {
	const handleWheel = useWheel()
	const machine = useMachine()

	return (
		<div
			className="relative overflow-x-hidden overflow-y-hidden"
			style={{ height, width, ...style }}
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
				{/* <Connections /> */}
			</SvgCanvas>
			<CanvasBackground height={height} width={width}>
				{/* <Connections /> */}
				<Nodes />
			</CanvasBackground>
		</div>
	)
}

const Nodes = React.memo(() => {
	const [nodeIDs] = useAtom(graph.nodeIDs)

	return (
		<>
			{nodeIDs.map((id) => {
				return <Node nodeID={id} key={id} />
			})}
		</>
	)
})

const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const [isSelected, setIsSelected] = React.useState(false)
	const [{ type: nodeType }] = useAtom(graph.getNodeMetadata(nodeID))
	const [nodePosition, setNodePosition] = useAtom(graph.getNodePosition(nodeID))
	const [nodeInputIDs] = useAtom(graph.getNodeInputIDs(nodeID))
	const [nodeOutputIDs] = useAtom(graph.getNodeOutputIDs(nodeID))

	return (
		<ControlledNode
			isSelected={isSelected}
			onNodeDeselect={() => setIsSelected(false)}
			onNodeSelect={() => setIsSelected(true)}
			onNodeStart={() => {}}
			onNodeMove={(id, pos) => {
				setNodePosition({ x: pos.x, y: pos.y })
			}}
			nodeId={nodeID}
			onStartConnector={() => {}}
			onCompleteConnector={() => {}}
			onNodeStop={() => {}}
			pos={nodePosition}
			title={nodeType}
			inputs={nodeInputIDs}
			outputs={nodeOutputIDs}
		/>
	)
})

function SvgCanvas({ children, height, width }) {
	const [viewBoxSize] = useAtom(scene.viewBoxSize)
	const [{ x, y, zoom }] = useAtom(scene.camera)
	return (
		<svg
			className="absolute"
			style={{
				height,
				width,
				userSelect: "none",
			}}
			viewBox={`${0} ${0} ${viewBoxSize.width} ${viewBoxSize.height}`}
		>
			<g
				transform={`scale(${zoom}) translate(${-x / zoom} ${-y / zoom})`}
				strokeWidth={1 / zoom}
			>
				{children}
			</g>
		</svg>
	)
}

function SelectionBrush() {
	const [brush] = useAtom(scene.brush)
	const state = useMachine()
	const [selectToolState] = useAtom(machine.selectToolState)

	React.useEffect(() => {
		if (selectToolState === "recentlyPointed") {
			const i = setTimeout(() => {
				state.send("RESET_POINTED", null)
			}, 400)
			return () => {
				clearTimeout(i)
			}
		}
	}, [selectToolState, state.send])

	return selectToolState === "brushSelecting" ? <Brush {...brush} /> : null
}
