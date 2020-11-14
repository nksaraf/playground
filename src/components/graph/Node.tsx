import React from "react"
import { NodeInputList } from "./NodeInput"
import { NodeOutputList } from "./NodeOutputList"

import useResizeObserver from "use-resize-observer"

export const ControlledNode = ({
	onClick,
	onResize,
	inputs,
	outputs,
	nodeId,
	isSelected,
	size,
	position,
	title,
}) => {
	const { ref } = useResizeObserver({
		onResize,
	})

	return (
		<section
			className={`node absolute ${isSelected ? "bg-green-500" : "bg-red-500"}`}
			ref={ref}
			onMouseDown={(e) => {
				e.preventDefault()
				e.stopPropagation()
				onClick()
			}}
			style={{
				zIndex: 10000,
				transform: `translateX(${position.x}px) translateY(${position.y}px)`,
			}}
		>
			<header className={"node-header"}>
				<span className={"node-title"}>
					{title} {size.width} x {size.height}
				</span>
			</header>
			<div className={"node-content flex justify-between"}>
				<NodeInputList items={inputs} onCompleteConnector={(idx) => {}} />
				<NodeOutputList items={outputs} onStartConnector={(idx) => {}} />
			</div>
		</section>
	)
}
