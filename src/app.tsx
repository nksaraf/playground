import * as React from "react"
import { styled } from "./theme"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"
import { useMachine } from "./hooks/useMachine"

import Toolbar from "./toolbar/toolbar"
import ZoomIndicator from "./overlays/zoom-indicator"
import Overlays from "./overlays/overlays"
import { exampleGraph, writeGraph } from "./state/graph-io"
import { useAtom, useUpdateAtom } from "./atom/atom"
import { scene } from "./state/scene"
import { graph } from "./state/graph"
import Brush from "./canvas-tavern/brush"
import { ControlledNode } from "./graph/Node"
import { machine } from "./state"
import RecoilizeDebugger from "recoilize"
import { Spline } from "./graph/Spline"

const root = document.getElementById("__next")
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
			{/* <RecoilizeDebugger root={root} /> */}

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
				transformOrigin: "0px 0px",
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
			</SvgCanvas>
			<SvgCanvas height={height} width={width}>
				<Connections />
			</SvgCanvas>
			<CanvasBackground height={height} width={width}>
				<Nodes />
			</CanvasBackground>
		</div>
	)
}

const Connections = React.memo(() => {
	const [allConnectionIDs] = useAtom(graph.connectionIDs)

	return (
		<>
			{allConnectionIDs.map((id) => {
				return <Connection connectionID={id} key={id} />
			})}
		</>
	)
})

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
	const [nodeInputIDs] = useAtom(graph.getNodePortIDs(nodeID))
	// const [nodeOutputIDs] = useAtom(graph.getNodeOutputIDs(nodeID))
	const [nodeSize, setNodeSize] = useAtom(graph.getNodeSize(nodeID))
	return (
		<ControlledNode
			onResize={setNodeSize}
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
			position={nodePosition}
			size={nodeSize}
			title={nodeType}
			inputs={nodeInputIDs}
			outputs={[]}
		/>
	)
})

export const Connection = React.memo(
	({ connectionID }: { connectionID: string }) => {
		const [{ start, end }] = useAtom(graph.getConnectionPosition(connectionID))
		console.log(start, end)
		return <Spline start={start} end={end} />
	}
)

function Transform({ children }) {
	const [{ x, y, zoom }] = useAtom(scene.camera)

	return (
		<g
			fill={"#AAAAAAA"}
			transform={`scale(${zoom}) translate(${-x / zoom} ${-y / zoom})`}
			strokeWidth={1 / zoom}
		>
			{children}
		</g>
	)
}

function SvgCanvas({ children, height, width }) {
	const [viewBoxSize] = useAtom(scene.viewBoxSize)
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
			<Transform>{children}</Transform>
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
