import React, { useState, useRef } from "react"
import { Node } from "./Node"
import { nodeIDs, connectionIDs } from "./store"
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { motion } from "framer-motion"
import { Connection } from "./Connection"

const Nodes = React.memo(() => {
	const allNodeIDs = useRecoilValue(nodeIDs)

	return (
		<>
			{allNodeIDs.map((id) => {
				return <Node nodeID={id} key={id} />
			})}
		</>
	)
})

const Connections = React.memo(() => {
	const allConnectionIDs = useRecoilValue(connectionIDs)

	const svgRef = useRef()
	return (
		<svg className="h-full w-full z-20 absolute" ref={svgRef}>
			{allConnectionIDs.map((id) => {
				return <Connection connectionID={id} key={id} />
			})}
		</svg>
	)
})

const canvasCamera = atom({
	key: "canvasCamera",
	default: {
		scale: 1,
		x: -1000,
		y: -1000,
	},
})

const canvas = atom({
	key: "canvas",
	default: {
		width: 2000,
		height: 2000,
	},
})

const mousePosition = atom({
	key: "mousePosition",
	default: {
		x: 0,
		y: 0,
	},
})

let resizeObserver

if (typeof window !== "undefined") {
	// @ts-ignore
	resizeObserver = new ResizeObserver((entries) => {
		// iterate over the entries, do something.
		console.log(entries)
	})
} else {
	resizeObserver = null
}

export const NodeGraph = () => {
	// const [] = useState([]);
	// const [] = useState(false);
	// const [] = useState({ x: 0, y: 0 });

	//   const onMouseMove = (e) => {
	//     let [pX, pY] = [e.clientX, e.clientY];
	//     e.stopPropagation();
	//     e.preventDefault();

	//     const svgRect = svgRef.current.getBoundingClientRect();
	//     // console.log(svgRect);
	//     setMousePos((old) => {
	//       return {
	//         ...old,
	//         ...{ x: pX - svgRect.left, y: pY - svgRect.top },
	//       };
	//     });
	//   };

	//   const onMouseUp = (e) => {
	//     setDragging(false);
	//   };

	//   const handleNodeStart = (nid) => {
	//     onNodeStartMove(nid);
	//   };

	//   const handleNodeStop = (nid, pos) => {
	//     onNodeMove(nid, pos);
	//   };

	//   const handleNodeMove = (idx, pos) => {
	//     let dataT = dataS;
	//     dataT.nodes[idx].x = pos.x;
	//     dataT.nodes[idx].y = pos.y;

	//     // console.log(dataT);
	//     // console.log({...dataS,...dataT});
	//     setDataS((old) => {
	//       return {
	//         ...old,
	//         ...dataT,
	//       };
	//     });
	//   };

	//   const handleStartConnector = (nid, outputIdx) => {
	//     let newSrc = [nid, outputIdx];

	//     setDragging(true);
	//     setSource(newSrc); // Not sure if this will work...
	//   };

	//   const handleCompleteConnector = (nid, inputIdx) => {
	//     if (dragging) {
	//       let fromNode = getNodeById(data.nodes, source[0]);
	//       let fromPinName = fromNode.fields.out[source[1]].name;
	//       let toNode = getNodeById(data.nodes, nid);
	//       let toPinName = toNode.fields.in[inputIdx].name;

	//       onNewConnector(fromNode.nid, fromPinName, toNode.nid, toPinName);
	//     }
	//     setDragging(false);
	//   };

	//   const handleRemoveConnector = (connector) => {
	//     if (onRemoveConnector) {
	//       onRemoveConnector(connector);
	//     }
	//   };

	//   const handleNodeSelect = (nid) => {
	//     if (onNodeSelect) {
	//       onNodeSelect(nid);
	//     }
	//   };

	//   const handleNodeDeselect = (nid) => {
	//     if (onNodeDeselect) {
	//       onNodeDeselect(nid);
	//     }
	//   };

	//   const computePinIdxfromLabel = (pins, pinLabel) => {
	//     let reval = 0;

	//     for (let pin of pins) {
	//       if (pin.name === pinLabel) {
	//         return reval;
	//       } else {
	//         reval++;
	//       }
	//     }
	//   };

	//   const getNodeById = (nodes, nid) => {
	//     let reval = 0;

	//     for (const node of nodes) {
	//       if (node.nid === nid) {
	//         return nodes[reval];
	//       } else {
	//         reval++;
	//       }
	//     }
	//   };

	//   let newConn = null;
	//   //   let i = 0;

	//   // console.log(dragging);
	//   if (dragging) {
	//     let sourceNode = getNodeById(dataS.nodes, source[0]);
	//     let connectorStart = computeOutOffsetByIndex(
	//       sourceNode.x,
	//       sourceNode.y,
	//       source[1]
	//     );
	//     let connectorEnd = {
	//       x: mousePos.x,
	//       y: mousePos.y,
	//     };

	//     // console.log(mousePos);
	//     newConn = <Spline start={connectorStart} end={connectorEnd} />;
	//   }

	const setMousePos = useSetRecoilState(mousePosition)
	const [{ scale, x, y }, setCamera] = useRecoilState(canvasCamera)
	const [{ width, height }, _] = useRecoilState(canvas)

	const [state, setState] = React.useState(false)

	React.useEffect(() => {
		function handleMouseMove(e: MouseEvent) {
			setMousePos({ x: e.screenX, y: e.screenY })
		}

		function handleMouseUp(e: MouseEvent) {
			if (state) {
				setState(false)
			}
		}

		window.addEventListener("mousemove", handleMouseMove)
		window.addEventListener("mouseup", handleMouseUp)

		return () => {
			window.removeEventListener("mousemove", handleMouseMove)
			window.removeEventListener("mouseup", handleMouseUp)
		}
	}, [])

	return (
		<div
			className="relative w-screen h-screen overflow-x-hidden overflow-y-hidden"
			onMouseDown={() => {
				setState(true)
			}}
			onMouseUp={() => {
				setState(false)
			}}
			onMouseMove={(e) => {
				if (state) {
					setCamera((cam) => ({
						...cam,
						x: cam.x + e.movementX,
						y: cam.y + e.movementY,
					}))
				}
			}}
			onWheel={(e) => {
				console.log(e)
				setCamera((cam) => ({
					...cam,
					scale: cam.scale + e.deltaY * 0.001,
				}))
			}}
		>
			<motion.div
				className="absolute"
				style={{
					height,
					width,
					scale,
					x,
					y,
				}}
			>
				<div className="relative w-full h-full">
					<Connections />
					<Nodes />
				</div>
			</motion.div>
			<Tools />
		</div>
	)
}

const Tools = React.memo(() => {
	const [camera, setCanvasZoom] = useRecoilState(canvasCamera)
	const [mouse] = useRecoilState(mousePosition)

	return (
		<div className="absolute top-8 left-8" style={{ zIndex: 100000 }}>
			<motion.button
				className="bg-white"
				onTap={() => {
					console.log("here")
					setCanvasZoom((z) => ({ ...z, scale: z.scale + 0.1 }))
				}}
			>
				+ Zoom In
			</motion.button>
			<motion.button
				className="bg-white ml-4"
				onTap={() => {
					console.log("here")
					setCanvasZoom((z) => ({ ...z, scale: z.scale - 0.1 }))
				}}
			>
				- Zoom Out
			</motion.button>

			<motion.button
				className="bg-white ml-4"
				onTap={() => {
					console.log("here")
					setCanvasZoom((z) => ({ ...z, x: z.x - 20 }))
				}}
			>
				{"<- Go Left"}
			</motion.button>
			<pre
				className="fixed font-mono condensed bg-blue-200 p-2 rounded-md"
				style={{
					// @ts-ignore
					"--bg-opacity": 0.78,
					fontSize: 9,
					lineHeight: 1.4,
				}}
			>
				{JSON.stringify({ camera, mouse }, null, 2)}
			</pre>
		</div>
	)
})
