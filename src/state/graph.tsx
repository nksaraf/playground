import { atom, atomFamily } from "./atom"
import { IFrame, IPoint, ISize } from "../../types"
import flatten from "lodash/flatten"
import { getBoundingBox } from "./box-transforms"

const nodeIDs = atom([])

const connectionIDs = atom([])

const getConnectionParams = atomFamily((id: string) => ({
	from: { node: "", field: "" },
	to: { node: "", field: "" },
}))

const getConnectionMetadata = atomFamily((id: string) => ({
	type: "",
	id: id,
}))

const getNodeMetadata = atomFamily((id: string) => ({
	type: "",
	id: id,
}))

const getNodePosition = atomFamily<IPoint>((id: string) => ({
	x: 0,
	y: 0,
}))

const getNodeSize = atomFamily<ISize>((id: string) => ({
	width: 0,
	height: 0,
}))

const getNodeInputIDs = atomFamily<string[]>((id: string) => [])

const getNodeOutputIDs = atomFamily((id: string) => [])

const getInputState = atomFamily((id: string) => ({
	name: "input",
	parentNode: null,
	index: -1,
}))

const getOutputState = atomFamily((id: string) => ({
	name: "input",
	parentNode: null,
	index: -1,
}))

const getInputConnectionIDs = atomFamily((id: string) => [])

const getOutputConnectionIDs = atomFamily((id: string) => [])

const getNodeBox = atomFamily<IFrame>((id: string) => (get) => ({
	...get(getNodeSize(id)),
	...get(getNodePosition(id)),
	id,
}))

const nodes = atom((get) =>
	get(nodeIDs).map((id) => ({
		...get(getNodeMetadata(id)),
		...get(getNodeBox(id)),
		inputs: get(getNodeInputIDs(id)).map((inp) => ({
			...get(getInputState(inp)),
			connections: get(getInputConnectionIDs(inp)),
			id: inp,
		})),
		ouputs: get(getNodeOutputIDs(id)).map((inp) => ({
			...get(getOutputState(inp)),
			connections: get(getOutputConnectionIDs(inp)),
			id: inp,
		})),
	}))
)

const getNodeConnectionIDs = atomFamily((id: string) => (get) => {
	return flatten([
		...get(getNodeOutputIDs(id)).map((outputID) =>
			get(getOutputConnectionIDs(outputID))
		),
		...get(getNodeInputIDs(id)).map((inputID) =>
			get(getInputConnectionIDs(inputID))
		),
	])
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
	getNodeInputIDs,
	getNodeConnectionIDs,
	getNodeOutputIDs,
	getInputConnectionIDs,
	getOutputConnectionIDs,
	getInputState,
	getOutputState,
	getNodeSize,
	selectedNodeIDs,
	selectedConnectionIDs,
	selected,
	selectionBounds,
	isNodeSelected,
	snapshot,
}
