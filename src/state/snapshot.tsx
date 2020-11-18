import { atom, atomFamily } from "../lib/atom"
import { compute, getPinValue } from "./compute"
import { graph } from "./graph"

const getNodeSnapshot = atomFamily(
	(id: string) => (get) => ({
		metadata: get(graph.getNodeMetadata(id)),
		size: get(graph.getNodeSize(id)),
		state: get(compute.getNodeState(id)),
		position: get(graph.getNodePosition(id)),
		id,
		pins: get(graph.getNodePinIDs(id)).map((inp) => ({
			metadata: get(graph.getPinMetadata(inp)),
			offset: get(graph.getPinOffset(inp)),
			value: get(getPinValue(inp)),
			id: inp,
		})),
	}),
	(id: string) => (get, set, node) => {
		set(graph.getNodeMetadata(node.id), node.metadata)
		set(graph.getNodeSize(node.id), node.size)
		set(graph.getNodePosition(node.id), node.position)
		set(
			graph.getNodePinIDs(node.id),
			node.pins.map((port) => port.id)
		)
		set(compute.getNodeState(id), node.state)
		node.pins.forEach((port) => {
			set(graph.getPinMetadata(port.id), port.metadata)
			set(graph.getPinOffset(port.id), port.offset)
		})
	}
)
const nodes = atom(
	(get) => get(graph.nodeIDs).map((id) => get(getNodeSnapshot(id))),
	(get, set, update) => {
		set(
			graph.nodeIDs,
			update.map((node) => node.id)
		)
		update.forEach((node) => {
			set(getNodeSnapshot(node.id), node)
		})
	}
)
const getConnectionSnapshot = atomFamily(
	(id: string) => (get) => ({
		params: get(graph.getConnectionParams(id)),
		metadata: get(graph.getConnectionMetadata(id)),
		id,
	}),
	(id: string) => (get, set, conn) => {
		set(graph.getConnectionParams(conn.id), conn.params)
		set(graph.getConnectionMetadata(conn.id), conn.metadata)
	}
)
const connections = atom(
	(get) => get(graph.connectionIDs).map((id) => get(getConnectionSnapshot(id))),
	(get, set, update) => {
		set(
			graph.connectionIDs,
			update.map((conn) => conn.id)
		)

		update.forEach((conn) => {
			set(getConnectionSnapshot(conn.id), conn)
		})
	}
)
const graphSnapshot = atom(
	(get) => ({
		nodes: get(nodes),
		connections: get(connections),
	}),
	(get, set, update) => {
		set(nodes, update["nodes"])
		set(connections, update["connections"])
	}
)

export const snapshot = {
	graphSnapshot,
	getNodeSnapshot,
	getConnectionSnapshot,
}
