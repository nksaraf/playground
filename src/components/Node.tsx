import * as React from "react"
import { useMachine } from "../hooks/useMachine"
import { atom, atomFamily, useAtom, useUpdateAtom } from "../atom"
import { graph } from "../state/graph"
import { selector } from "../state"
import useResizeObserver from "use-resize-observer"
import { styled } from "../theme"

const NodeBody = styled("div", {
	display: "flex",
	justifyContent: "center",
})

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const [isSelected, setIsSelected] = useAtom(selector.isNodeSelected(nodeID))
	const [position, setNodePosition] = useAtom(graph.getNodePosition(nodeID))
	const [inputs] = useAtom(graph.getNodeInputIDs(nodeID))
	const [outputs] = useAtom(graph.getNodeOutputIDs(nodeID))
	const [nodeSize, setNodeSize] = useAtom(graph.getNodeSize(nodeID))
	const machine = useMachine()

	const { ref } = useResizeObserver({
		onResize: setNodeSize,
	})

	return (
		<section
			className={`absolute ${
				isSelected ? "bg-gray-800" : "bg-white"
			} rounded-xl shadow-xl pb-3`}
			ref={ref}
			onMouseDown={(e) => {
				e.preventDefault()
				e.stopPropagation()
				machine.send("POINTER_DOWN_ON_BOX", { id: nodeID })
			}}
			style={{
				transform: `translateX(${position.x}px) translateY(${position.y}px)`,
			}}
		>
			<NodeHeader nodeID={nodeID} />
			<NodeBody>
				<NodeInputs items={inputs} />
				<div className={"w-24"} />
				<NodeOutputs items={outputs} />
			</NodeBody>
		</section>
	)
})

function NodeHeader({ nodeID }) {
	const [meta] = useAtom(graph.getNodeMetadata(nodeID))
	const [isSelected, setIsSelected] = useAtom(selector.isNodeSelected(nodeID))

	return (
		<header className={"py-3 px-4 flex flex-col items-center"}>
			<div className={"text-xs text-gray-500 font-normal uppercase"}>Setup</div>
			<div
				className={`text-lg ${
					isSelected ? "text-gray-400" : "text-gray-600"
				} font-semibold`}
			>
				{meta.componentID}
			</div>
		</header>
	)
}

function NodeInputs({ items }) {
	return (
		<div className="flex flex-col gap-2">
			{items.map((id) => (
				<NodeInput inputID={id} key={id} />
			))}
		</div>
	)
}

function NodeOutputs({ items }) {
	return (
		<div className="flex flex-col gap-2 items-end">
			{items.map((id) => (
				<NodeOutput outputID={id} key={id} />
			))}
		</div>
	)
}

const getPinHasConnections = atomFamily((id: string) => (get) => {
	return get(graph.getPinConnectionIDs(id)).length > 0
})

const getPinIsAcceptingConnections = atomFamily((id: string) => (get) => {
	const fromPin = get(graph.addingConnectorFromPinID)
	if (fromPin === null) {
		return true
	} else {
		if (fromPin === id) {
			return false
		} else if (
			get(graph.getPinMetadata(fromPin)).parentNode ===
				get(graph.getPinMetadata(id)).parentNode ||
			get(graph.getPinMetadata(fromPin)).type ===
				get(graph.getPinMetadata(id)).type
		) {
			return false
		}
		return true
	}
})

const getPinAddingNewConnection = atomFamily((id: string) => (get) => {
	return get(graph.addingConnectorFromPinID) === id
})

function NodeInput({ inputID }) {
	const [input] = useAtom(graph.getPinMetadata(inputID))
	const ref = usePinRef(inputID)
	const [hasConnections] = useAtom(getPinHasConnections(inputID))
	const [isAcceptingConnection] = useAtom(getPinIsAcceptingConnections(inputID))
	const machine = useMachine()
	const [isHovered, setIsHovered] = React.useState(false)
	const [isAddingNewConnection] = useAtom(getPinAddingNewConnection(inputID))

	const isActive =
		hasConnections ||
		(isAcceptingConnection && isHovered) ||
		isAddingNewConnection

	return (
		<div>
			<div
				className="flex items-center gap-1"
				onMouseEnter={(e) => {
					setIsHovered(true)
				}}
				onMouseLeave={(e) => {
					setIsHovered(false)
				}}
				onMouseUp={(e) => {
					e.preventDefault()
					e.stopPropagation()
					machine.send("POINTER_UP_ON_PIN", { pinID: inputID })
				}}
			>
				<div
					ref={ref}
					onMouseDown={(e) => {
						e.preventDefault()
						e.stopPropagation()
						console.log("heree")
						machine.send("POINTER_DOWN_ON_PIN", { pinID: inputID })
					}}
				>
					<svg
						viewBox="0 0 24 24"
						style={{
							cursor: !isAcceptingConnection ? "not-allowed" : "pointer",
							transform: `translateX(-6px) scale(${isHovered ? 1.1 : 1.0})`,
						}}
						className={`h-3 w-3 ${
							isActive ? "text-blue-500" : "text-gray-500"
						}`}
					>
						<circle
							cx={12}
							cy={12}
							r={9}
							strokeWidth={3}
							fill="transparent"
							className="stroke-current"
						/>
						{isActive && (
							<circle cx={12} cy={12} r={6} className="fill-current" />
						)}
					</svg>
				</div>
				<div className="text-gray-500 text-xs">{input.name}</div>
			</div>
		</div>
	)
}

function NodeOutput({ outputID }) {
	const [output] = useAtom(graph.getPinMetadata(outputID))
	const [connIDs] = useAtom(graph.getPinConnectionIDs(outputID))
	const machine = useMachine()
	const ref = usePinRef(outputID)

	const [hasConnections] = useAtom(getPinHasConnections(outputID))
	const [isAddingNewConnection] = useAtom(getPinAddingNewConnection(outputID))
	const [isAcceptingConnection] = useAtom(
		getPinIsAcceptingConnections(outputID)
	)
	const [isHovered, setIsHovered] = React.useState(false)

	const isActive =
		hasConnections ||
		(isAcceptingConnection && isHovered) ||
		isAddingNewConnection

	return (
		<div>
			<div
				className="flex items-center gap-1"
				onMouseEnter={(e) => {
					setIsHovered(true)
				}}
				onMouseLeave={(e) => {
					setIsHovered(false)
				}}
				onMouseUp={(e) => {
					e.preventDefault()
					e.stopPropagation()
					machine.send("POINTER_UP_ON_PIN", { pinID: outputID })
				}}
			>
				<div className="text-gray-500 text-xs">{output.name}</div>
				<div
					ref={ref}
					onMouseDown={(e) => {
						e.preventDefault()
						e.stopPropagation()
						console.log("heree")
						machine.send("POINTER_DOWN_ON_PIN", { pinID: outputID })
					}}
				>
					<svg
						viewBox="0 0 24 24"
						style={{
							cursor: !isAcceptingConnection ? "not-allowed" : "pointer",
							transform: `translateX(6px) scale(${isHovered ? 1.1 : 1.0})`,
						}}
						className={`h-3 w-3 ${
							isActive ? "text-blue-500" : "text-gray-500"
						}`}
					>
						<circle
							cx={12}
							cy={12}
							r={9}
							strokeWidth={3}
							fill="transparent"
							className="stroke-current"
						/>
						{isActive && (
							<circle cx={12} cy={12} r={6} className="fill-current" />
						)}
					</svg>
				</div>
			</div>
		</div>
	)
}

function usePinRef(portID) {
	const setOffset = useUpdateAtom(graph.getPinOffset(portID))
	const ref = React.useRef<HTMLDivElement>()

	React.useLayoutEffect(() => {
		setOffset({
			x: ref.current?.offsetLeft + ref.current?.offsetWidth / 2,
			y: ref.current?.offsetTop + ref.current?.offsetHeight / 2,
		})
	}, [
		ref.current?.offsetLeft,
		ref.current?.offsetTop,
		ref.current?.offsetWidth,
		ref.current?.offsetHeight,
	])

	return ref
}
