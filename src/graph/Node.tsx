import React, { useEffect, useState } from "react"
// import onClickOutside from "react-onclickoutside";
import Draggable from "react-draggable"

import { NodeInputList } from "./NodeInput"
import { NodeOutputList } from "./NodeOutputList"
import { motion } from "framer-motion"
import { selectorFamily, useRecoilState } from "recoil"
import {
	nodeTypeByID,
	nodePositionByID,
	inputIDsByNodeID,
	outputIDsByNodeID,
} from "./store"

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
	const [isSelected, setIsSelected] = React.useState(false)
	const [nodeType] = useRecoilState(nodeTypeByID(nodeID))
	const [nodePosition, setNodePosition] = useRecoilState(
		nodePositionByID(nodeID)
	)
	const [nodeInputIDs] = useRecoilState(inputIDsByNodeID(nodeID))
	const [nodeOutputIDs] = useRecoilState(outputIDsByNodeID(nodeID))

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

export const ControlledNode = ({
	onNodeDeselect,
	onNodeSelect,
	onNodeStart,
	onNodeStop,
	onNodeMove,
	//   onClick,
	//   onDoubleClick,
	onStartConnector,
	onCompleteConnector,
	inputs,
	outputs,
	nodeId,
	isSelected,
	pos,
	title,
}) => {
	// const [selected, setSelected] = useState(false);
	// const [elementPosition] = useRecoilState(nodePositionByID(nodeId));
	// const [nodeType] = useRecoilState(nodeTypeByID(nodeId));
	// useEffect(() => {}, [selected]);

	const handleDragStart = (eve, ui) => {
		onNodeStart?.(nodeId, ui)
	}

	const handleDragStop = (eve, ui) => {
		onNodeStop?.(nodeId, { x: ui.x, y: ui.y })
	}

	const handleDrag = (eve, ui) => {
		// console.log(ui);
		onNodeMove?.(nodeId, { x: ui.x, y: ui.y })
	}

	const handleOnStartConnector = (idx) => {
		onStartConnector?.(nodeId, idx)
	}

	const handleOnCompleteConnector = (idx) => {
		onCompleteConnector?.(nodeId, idx)
	}

	//   const handleClick = (e) => {
	//     //   setSelected(true);s
	//     //   if (onNodeSelect) {
	//     onClick?.(nodeId);
	//     //   }
	//   };

	//   const handleDoubleClick = (e) => {
	//     onDoubleClick?.(nodeId);
	//   };

	// DragNode.handleClickOutside = () => {
	//   if (onNodeDeselect && selected) {
	//     onNodeDeselect(nid);
	//   }
	//   setSelected(false);
	// };

	const ref = React.useRef()

	return (
		// <Draggable
		// 	position={pos}
		// 	handle=".node-header"
		// 	onStart={(eve, ui) => {
		// 		eve.preventDefault()
		// 		eve.stopPropagation()
		// 		handleDragStart(eve, ui)
		// 	}}
		// 	onStop={(eve, ui) => handleDragStop(eve, ui)}
		// 	onDrag={(eve, ui) => handleDrag(eve, ui)}
		// >
		<section
			className="node absolute"
			ref={ref}
			onMouseDown={onNodeStart()}
			style={{
				zIndex: 10000,
				transform: `translateX(${pos.x}px) translateY(${pos.y}px)`,
			}}
		>
			<header className={"node-header"}>
				<span className={"node-title"}>{title}</span>
			</header>
			<div className={"node-content"}>
				<NodeInputList
					items={inputs}
					onCompleteConnector={(idx) => handleOnCompleteConnector(idx)}
				/>
				<NodeOutputList
					items={outputs}
					onStartConnector={(idx) => handleOnStartConnector(idx)}
				/>
			</div>
		</section>
		// </Draggable>
	)
}

// export const Draggable = ({
//   isDragging,
//   setIsDragging,
//   width,
//   height,
//   x,
//   y,
//   radius,
//   children,
// }) => {
//   return (
//     <motion.div
//       {...{ isDragging }}
//       {...{ setIsDragging }}
//       drag
//       dragConstraints={{
//         left: Number(`${0 - x}`),
//         right: Number(`${width - x}`),
//         top: Number(`${0 - y}`),
//         bottom: Number(`${height - y}`),
//       }}
//       dragElastic={0}
//       dragMomentum={false}
//       data-test-id="dragabble-element"
//     >
//       {children}
//     </motion.div>
//   );
// };
