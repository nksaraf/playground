import * as React from "react"
import { useMachine } from "../hooks/useMachine"
import { useAtom, useUpdateAtom } from "../atom"
import { graph } from "../state/graph"
import { selector } from "../state"
import useResizeObserver from "use-resize-observer"

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
			className={`absolute bg-white`}
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
			<header className={""}>
				<div className={"text-sm"}>Setup</div>
				<div className={"text-lg"}>Copy Files</div>
			</header>
			<div className={"node-content flex justify-between"}>
				<NodeInputs items={inputs} />
				<NodeOutputs items={outputs} />
			</div>
		</section>
	)
})

function NodeInputs({ items }) {
	return (
		<div>
			{items.map((id) => (
				<NodeInput inputID={id} key={id} />
			))}
		</div>
	)
}

function NodeInput({ inputID }) {
	const [input] = useAtom(graph.getPortMetadata(inputID))
	const ref = usePortRef(inputID)

	return (
		<div className="flex">
			<div ref={ref} />
			{input.name}
		</div>
	)
}

function NodeOutputs({ items }) {
	return (
		<div>
			{items.map((id) => (
				<NodeOutput outputID={id} key={id} />
			))}
		</div>
	)
}

function usePortRef(portID) {
	const setOffset = useUpdateAtom(graph.getPortOffset(portID))
	const ref = React.useRef<any>()

	React.useLayoutEffect(() => {
		setOffset({
			x: ref.current?.offsetLeft,
			y: ref.current?.offsetTop,
		})
	}, [])

	return ref
}

function NodeOutput({ outputID }) {
	const [output] = useAtom(graph.getPortMetadata(outputID))
	const ref = usePortRef(outputID)
	return (
		<div className="flex">
			{output.name}
			<div ref={ref} />
		</div>
	)
}
