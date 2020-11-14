import { atom, atomFamily } from "../atom/atom"
import { IFrame, IPoint, ISize } from "../../types"
import flatten from "lodash/flatten"
import { getBoundingBox } from "./box-transforms"

const nodeIDs = atom([])

const connectionIDs = atom([])

const getConnectionParams = atomFamily((id: string) => ({
	from: { node: "", port: "" },
	to: { node: "", port: "" },
}))

const getConnectionMetadata = atomFamily((id: string) => ({
	type: "",
	id: id,
}))

const getNodeMetadata = atomFamily((id: string) => ({
	type: "",
	id: id,
}))

const getPortMetadata = atomFamily((id: string) => ({
	type: "",
	id: id,
	name: "input",
	parentNode: null,
	index: -1,
}))

const getNodePosition = atomFamily<IPoint>((id: string) => ({
	x: 0,
	y: 0,
}))

const getNodeSize = atomFamily<ISize>((id: string) => ({
	width: 0,
	height: 0,
}))

const getNodePortIDMap = atomFamily<any>((id: string) => ({}))

const getNodePortIDs = atomFamily<string[]>(
	(id: string) => (get) => Object.keys(get(getNodePortIDMap(id))),
	(id: string) => (get, set, update) =>
		set(getNodePortIDMap(id), Object.fromEntries(update.map((u) => [u, true])))
)

const getPortConnectionIDs = atomFamily((id: string) => [])

const getNodeBox = atomFamily<IFrame>((id: string) => (get) => ({
	...get(getNodeSize(id)),
	...get(getNodePosition(id)),
	id,
}))

const getPortOffset = atomFamily((id: string) => ({ x: 0, y: 0 }))

const getPortPosition = atomFamily((id: string) => (get) => {
	const port = get(getPortMetadata(id))
	const nodePos = get(getNodePosition(port.parentNode))
	const portOffset = get(getPortOffset(id))

	return { x: nodePos.x + portOffset.x, y: nodePos.y + portOffset.y }
})

const getConnectionPosition = atomFamily((id: string) => (get) => {
	const params = get(getConnectionParams(id))

	// const fromNode = get(nodePositionByID(params.fromNode))
	// const toNode = get(nodePositionByID(params.toNode))

	// const toField = get(inputStateByID(params.inputField))
	// const fromField = get(outputStateByID(params.outputField))

	// let splinestart = computeOutOffsetByIndex(
	// 	fromNode.x,
	// 	fromNode.y,
	// 	fromField.index
	// )
	// let splineend = computeInOffsetByIndex(toNode.x, toNode.y, toField.index)
	return {
		start: get(getPortPosition(params.from.port)),
		end: get(getPortPosition(params.to.port)),
	}
})
const nodes = atom((get) =>
	get(nodeIDs).map((id) => ({
		...get(getNodeMetadata(id)),
		...get(getNodeBox(id)),
		ports: get(getNodePortIDs(id)).map((inp) => ({
			...get(getPortMetadata(inp)),
			connections: get(getPortConnectionIDs(inp)),
			id: inp,
		})),
	}))
)

const getNodeConnectionIDs = atomFamily((id: string) => (get) => {
	return flatten(
		get(getNodePortIDs(id)).map((outputID) =>
			get(getPortConnectionIDs(outputID))
		)
	)
})

const connections = atom((get) =>
	get(connectionIDs).map((id) => ({
		...get(getConnectionParams(id)),
		...get(getConnectionMetadata(id)),
	}))
)

const selectedNodeIDs = atom([])
const selectedConnectionIDs = atom([])

const selected = atom((get) => ({
	nodesIDs: get(selectedNodeIDs),
	connectionIDs: get(selectedConnectionIDs),
}))

const selectionBounds = atom((get) => {
	const ids = get(selectedNodeIDs)
	if (ids.length === 0) {
		return null
	} else {
		return getBoundingBox(ids.map((id) => get(getNodeBox(id))))
	}
})

const isNodeSelected = atomFamily((id: string) => (get) =>
	get(selectedNodeIDs).includes(id)
)

const snapshot = atom((get) => ({
	nodes: get(nodes),
	connections: get(connections),
	selectedNodeIDs: get(selectedNodeIDs),
	selectedConnectionIDs: get(selectedConnectionIDs),
}))

export const graph = {
	nodeIDs,
	nodes,
	connections,
	connectionIDs,
	getConnectionParams,
	getConnectionMetadata,
	getNodeMetadata,
	getNodePosition,
	getNodeBox,
	getNodePortIDs,
	getNodeConnectionIDs,
	getPortMetadata,
	getPortConnectionIDs,
	getNodeSize,
	selectedNodeIDs,
	selectedConnectionIDs,
	selected,
	selectionBounds,
	isNodeSelected,
	snapshot,
	getPortOffset,
	getPortPosition,
	getConnectionPosition,
}
