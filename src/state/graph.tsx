import { atom, atomFamily } from "../atom"
import { IFrame, IPoint, ISize } from "../../types"
import flatten from "lodash/flatten"
import { Actions } from "./machine"
import { scene, selector, toolState } from "."

const nodeIDMap = atom<any>({})

const nodeIDs = atom<string[]>(
	(get) => Object.keys(get(nodeIDMap)),
	(get, set, update) =>
		set(nodeIDMap, Object.fromEntries(update.map((u) => [u, true])))
)

const connectionIDMap = atom<any>({})

const connectionIDs = atom<string[]>(
	(get) => Object.keys(get(connectionIDMap)),
	(get, set, update) =>
		set(connectionIDMap, Object.fromEntries(update.map((u) => [u, true])))
)

const getConnectionParams = atomFamily((id: string) => ({
	from: "null",
	to: "null",
}))

const getConnectionMetadata = atomFamily((id: string) => ({
	type: "",
	id: id,
}))

const getNodeMetadata = atomFamily(
	(id: string) =>
		({
			type: "component",
			componentID: "-1",
			id: id,
		} as {
			id: string
			type: "component"
			componentID: string
			[key: string]: any
		})
)

const getPinMetadata = atomFamily((id: string) => ({
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

const getNodePinIDs = atomFamily<string[]>(
	(id: string) => (get) => Object.keys(get(getNodePortIDMap(id))),
	(id: string) => (get, set, update) =>
		set(getNodePortIDMap(id), Object.fromEntries(update.map((u) => [u, true])))
)

const getPinConnectionIDs = atomFamily((id: string) => (get) =>
	get(connectionIDs).filter(
		(connID) =>
			get(getConnectionParams(connID)).from === id ||
			get(getConnectionParams(connID)).to === id
	)
)

const getNodeBox = atomFamily<IFrame>((id: string) => (get) => ({
	...get(getNodeSize(id)),
	...get(getNodePosition(id)),
	id,
}))

const getPinOffset = atomFamily((id: string) => ({ x: 0, y: 0 }))

const getPinPosition = atomFamily((id: string) => (get) => {
	const port = get(getPinMetadata(id))
	const nodePos = get(getNodePosition(port.parentNode))
	const portOffset = get(getPinOffset(id))

	return { x: nodePos.x + portOffset.x, y: nodePos.y + portOffset.y }
})

const getConnectionPosition = atomFamily((id: string) => (get) => {
	const params = get(getConnectionParams(id))

	return {
		start: get(getPinPosition(params.from)),
		end: get(getPinPosition(params.to)),
	}
})

const nodes = atom(
	(get) =>
		get(nodeIDs).map((id) => ({
			metadata: get(getNodeMetadata(id)),
			size: get(getNodeSize(id)),
			position: get(getNodePosition(id)),
			id,
			ports: get(getNodePinIDs(id)).map((inp) => ({
				metadata: get(getPinMetadata(inp)),
				offset: get(getPinOffset(inp)),
				id: inp,
			})),
		})),
	(get, set, update) => {
		set(
			nodeIDs,
			update.map((node) => node.id)
		)
		update.forEach((node) => {
			set(getNodeMetadata(node.id), node.metadata)
			set(getNodeSize(node.id), node.size)
			set(getNodePosition(node.id), node.position)
			set(getNodePosition(node.id), node.position)
			set(
				getNodePinIDs(node.id),
				node.ports.map((port) => port.id)
			)
			node.ports.forEach((port) => {
				set(getPinMetadata(port.id), port.metadata)
				set(getPinOffset(port.id), port.offset)
			})
		})
	}
)

const getNodeConnectionIDs = atomFamily((id: string) => (get) => {
	return flatten(
		get(getNodePinIDs(id)).map((outputID) => get(getPinConnectionIDs(outputID)))
	)
})

const connections = atom(
	(get) =>
		get(connectionIDs).map((id) => ({
			params: get(getConnectionParams(id)),
			metadata: get(getConnectionMetadata(id)),
			id,
		})),
	(get, set, update) => {
		set(
			connectionIDs,
			update.map((conn) => conn.id)
		)

		update.forEach((conn) => {
			set(getConnectionParams(conn.id), conn.params)
			set(getConnectionMetadata(conn.id), conn.metadata)
		})
	}
)

const getNodeInputIDs = atomFamily((id: string) => (get) => {
	const nodePorts = get(getNodePinIDs(id))
		.map((pid) => get(getPinMetadata(pid)))
		.filter((port) => port.type === "input")

	return nodePorts.map((np) => np.id)
})

const getNodeOutputIDs = atomFamily((id: string) => (get) => {
	const nodePorts = get(getNodePinIDs(id))
		.map((pid) => get(getPinMetadata(pid)))
		.filter((port) => port.type === "output")

	return nodePorts.map((np) => np.id)
})

const snapshot = atom(
	(get) => ({
		nodes: get(nodes),
		connections: get(connections),
	}),
	(get, set, update) => {
		set(nodes, update["nodes"])
		set(connections, update["connections"])
	}
)

const insertToolState = atom(
	"insertIdle" as "insertIdle" | "insertingComponent" | "insertingConnector"
)

import { uid } from "uid"
import { library } from "./libary"

// let surface: Surface | undefined = undefined

function getUUID() {
	return uid()
}

const addNewComponent = atom(null, (get, set, { componentID, id }) => {
	const pointer = get(scene.documentPointer)
	const { metadata, type, pins } = get(
		library.getComponentMetadata(componentID)
	)

	pins.forEach((pin, index) => {
		const i = `${id}/${pin.role}/${index}/${pin.name}`
		set(getPinMetadata(i), {
			...pin,
			index,
			id: i,
			parentNode: id,
			type: pin.role,
		})
	})

	set(getNodeMetadata(id), {
		type,
		componentID,
		...metadata,
		id,
	})

	set(
		getNodePinIDs(id),
		pins.map((pin, index) => `${id}/${pin.role}/${index}/${pin.name}`)
	)
	set(getNodePosition(id), { ...pointer })
	set(nodeIDs, (ids) => [...ids, id])
})

const addingComponentWithID = atom(null as string | null)
const addingConnectorFromPinID = atom(null as string | null)

const addNewDataConnector = atom(null, (get, set, { fromPin, toPin }) => {
	const connID = `${fromPin}->${toPin}`
	set(connectionIDs, (ids) => [...ids, connID])
	set(getConnectionParams(connID), { from: fromPin, to: toPin })
	set(getConnectionMetadata(connID), { id: connID, type: "data" })
})

const completeInsertingConnector = atom(
	null,
	(get, set, { pinID }: { pinID: string }) => {
		const fromPin = get(addingConnectorFromPinID)

		set(
			addNewDataConnector,
			get(getPinMetadata(fromPin)).type === "output"
				? {
						fromPin,
						toPin: pinID,
				  }
				: {
						toPin: fromPin,
						fromPin: pinID,
				  }
		)
		set(insertToolState, "insertIdle")
		set(addingConnectorFromPinID, null)
		set(toolState, "selectTool")
	}
)

export const insertToolDispatch = atom(null, (get, set, action: Actions) => {
	switch (get(insertToolState)) {
		case "insertIdle": {
			switch (action.type) {
				case "POINTER_DOWN_ON_COMPONENT_BUTTON": {
					set(addingComponentWithID, action.payload.componentID)
					set(insertToolState, "insertingComponent")
					return
				}
				case "POINTER_DOWN_ON_PIN": {
					set(addingConnectorFromPinID, action.payload.pinID)
					set(insertToolState, "insertingConnector")
				}
			}
		}
		case "insertingComponent": {
			switch (action.type) {
				case "ESCAPE": {
					set(insertToolState, "insertIdle")
					set(addingComponentWithID, null)
					set(toolState, "selectTool")
					return
				}
				case "POINTER_DOWN": {
					const id = getUUID()
					const componentID = get(addingComponentWithID)
					set(addNewComponent, {
						componentID,
						id,
					})
					set(selector.selectedNodeIDs, [id])
					set(insertToolState, "insertIdle")
					set(addingComponentWithID, null)
					set(toolState, "selectTool")
					return
				}

				case "POINTER_UP": {
					const { screenPointer } = get(scene.lastPointState)
					const { x, y } = get(scene.screenPointer)
					const dist = Math.hypot(x - screenPointer.x, y - screenPointer.y)
					if (dist > 20) {
						const id = getUUID()
						const componentID = get(addingComponentWithID)
						set(addNewComponent, {
							componentID,
							id,
						})
						set(selector.selectedNodeIDs, [id])
						set(addingComponentWithID, null)
						set(insertToolState, "insertIdle")
						set(toolState, "selectTool")
					}
					return
				}
			}
		}
		case "insertingConnector": {
			switch (action.type) {
				case "ESCAPE": {
					set(insertToolState, "insertIdle")
					set(addingConnectorFromPinID, null)
					set(toolState, "selectTool")
					return
				}
				case "POINTER_UP_ON_PIN": {
					const fromPin = get(addingConnectorFromPinID)
					if (fromPin === action.payload.pinID) {
					} else if (
						get(getPinMetadata(fromPin)).parentNode ===
							get(getPinMetadata(action.payload.pinID)).parentNode ||
						get(getPinMetadata(fromPin)).type ===
							get(getPinMetadata(action.payload.pinID)).type
					) {
					} else {
						set(completeInsertingConnector, action.payload)
					}
					return
				}
			}
		}
	}
})

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
	getNodePortIDs: getNodePinIDs,
	getNodeConnectionIDs,
	getPinMetadata,
	getPinConnectionIDs,
	getNodeSize,
	getNodeInputIDs,
	getNodeOutputIDs,
	snapshot,
	addingComponentWithID,
	addingConnectorFromPinID,
	getPinOffset,
	getPinPosition,
	getConnectionPosition,
	insertToolState,
}
