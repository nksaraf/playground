import * as React from "react"
import { useMachine } from "../hooks/useMachine"
import { atomFamily, useAtom, useUpdateAtom } from "../atom"
import { graph } from "../state/graph"
import { selector } from "../state"
import useResizeObserver from "use-resize-observer"

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const [isSelected, setIsSelected] = useAtom(selector.isNodeSelected(nodeID))
	const [position, setNodePosition] = useAtom(graph.getNodePosition(nodeID))
	const [inputs] = useAtom(graph.getNodeInputIDs(nodeID))
	const [outputs] = useAtom(graph.getNodeOutputIDs(nodeID))
	const [meta] = useAtom(graph.getNodeMetadata(nodeID))
	const [nodeSize, setNodeSize] = useAtom(graph.getNodeSize(nodeID))
	const machine = useMachine()

	const { ref } = useResizeObserver({
		onResize: setNodeSize,
	})

	return (
		<section
			className={`absolute bg-white rounded-xl shadow-xl pb-3`}
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
			<header className={"py-3 px-4 flex flex-col items-center"}>
				<div className={"text-xs text-gray-500 font-normal uppercase"}>
					Setup
				</div>
				<div className={"text-lg text-gray-600 font-semibold"}>{meta.type}</div>
			</header>
			<div className={"flex justify-between"}>
				<NodeInputs items={inputs} />
				<div className={"w-24"} />
				<NodeOutputs items={outputs} />
			</div>
		</section>
	)
})

function NodeInputs({ items }) {
	return (
		<div className="flex flex-col gap-2">
			{items.map((id) => (
				<NodeInput inputID={id} key={id} />
			))}
		</div>
	)
}

const getIsAddingConnectorToPin = atomFamily((id: string) => (get) => {
	return get(graph.addingConnectorFromPin) === id
})

function NodeInput({ inputID }) {
	const [input] = useAtom(graph.getPinMetadata(inputID))
	const [connIDs] = useAtom(graph.getPinConnectionIDs(inputID))
	const ref = usePortRef(inputID)
	const [isAddingConnector] = useAtom(getIsAddingConnectorToPin(inputID))
	const machine = useMachine()

	return (
		<div>
			<div className="flex items-center gap-1">
				<div ref={ref}>
					<svg
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
							console.log("heree")
							machine.send("POINTER_DOWN_ON_PIN", { pinID: inputID })
						}}
						onMouseUp={(e) => {
							e.preventDefault()
							e.stopPropagation()
							machine.send("POINTER_UP_ON_PIN", { pinID: inputID })
						}}
						viewBox="0 0 24 24"
						style={{ transform: "translateX(-4px)" }}
						className={`h-3 w-3 ${
							connIDs.length > 0 || isAddingConnector
								? "text-blue-500"
								: "text-gray-300"
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
						<circle cx={12} cy={12} r={6} className="fill-current" />
					</svg>
				</div>
				<div className="text-gray-500 text-xs">{input.name}</div>
			</div>
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

function usePortRef(portID) {
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

function NodeOutput({ outputID }) {
	const [output] = useAtom(graph.getPinMetadata(outputID))
	const [connIDs] = useAtom(graph.getPinConnectionIDs(outputID))
	const machine = useMachine()
	const ref = usePortRef(outputID)
	const [isAddingConnector] = useAtom(getIsAddingConnectorToPin(outputID))

	return (
		<div>
			<div className="flex items-center gap-1">
				<div className="text-gray-500 text-xs">{output.name}</div>
				<div ref={ref}>
					<svg
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
							machine.send("POINTER_DOWN_ON_PIN", { pinID: outputID })
						}}
						onMouseUp={(e) => {
							e.preventDefault()
							e.stopPropagation()
							machine.send("POINTER_UP_ON_PIN", { pinID: outputID })
						}}
						viewBox="0 0 24 24"
						style={{ transform: "translateX(+4px)" }}
						className={`h-3 w-3 ${
							connIDs.length > 0 || isAddingConnector
								? "text-blue-500"
								: "text-gray-300"
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
						<circle cx={12} cy={12} r={6} className="fill-current" />
					</svg>
				</div>
			</div>
		</div>
	)
}
