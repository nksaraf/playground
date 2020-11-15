import { atom, atomFamily } from "../atom"
import { IFrame, IPoint, ISize } from "../../types"
import flatten from "lodash/flatten"
import { Actions } from "./machine"
import { scene, selector, toolState } from "."

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

const getNodePortIDs = atomFamily<string[]>(
	(id: string) => (get) => Object.keys(get(getNodePortIDMap(id))),
	(id: string) => (get, set, update) =>
		set(getNodePortIDMap(id), Object.fromEntries(update.map((u) => [u, true])))
)

const getPinConnectionIDs = atomFamily((id: string) => (get) =>
	get(connectionIDs).filter(
		(connID) => get(getConnectionParams(connID)).from.port === id
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
		start: get(getPinPosition(params.from.port)),
		end: get(getPinPosition(params.to.port)),
	}
})

const nodes = atom((get) =>
	get(nodeIDs).map((id) => ({
		...get(getNodeMetadata(id)),
		...get(getNodeBox(id)),
		ports: get(getNodePortIDs(id)).map((inp) => ({
			...get(getPinMetadata(inp)),
			connections: get(getPinConnectionIDs(inp)),
			id: inp,
		})),
	}))
)

const getNodeConnectionIDs = atomFamily((id: string) => (get) => {
	return flatten(
		get(getNodePortIDs(id)).map((outputID) =>
			get(getPinConnectionIDs(outputID))
		)
	)
})

const connections = atom((get) =>
	get(connectionIDs).map((id) => ({
		...get(getConnectionParams(id)),
		...get(getConnectionMetadata(id)),
	}))
)

const getNodeInputIDs = atomFamily((id: string) => (get) => {
	const nodePorts = get(getNodePortIDs(id))
		.map((pid) => get(getPinMetadata(pid)))
		.filter((port) => port.type === "input")

	return nodePorts.map((np) => np.id)
})

const getNodeOutputIDs = atomFamily((id: string) => (get) => {
	const nodePorts = get(getNodePortIDs(id))
		.map((pid) => get(getPinMetadata(pid)))
		.filter((port) => port.type === "output")

	return nodePorts.map((np) => np.id)
})

const snapshot = atom((get) => ({
	nodes: get(nodes),
	connections: get(connections),
}))

const insertToolState = atom(
	"insertIdle" as "insertIdle" | "insertingComponent" | "insertingConnector"
)

import uniqueId from "lodash/uniqueId"
import { v4 as uuid } from "uuid"

// let surface: Surface | undefined = undefined
const id = uuid()

function getId() {
	return uniqueId(id)
}

const insertNewComponent = atom(null, (get, set, { componentID, id }) => {
	set(nodeIDs, (ids) => [...ids, id])
	const pointer = get(scene.documentPointer)
	set(getNodeMetadata(id), {
		type: "component",
		// componentID,
		id,
	})
	set(getNodePosition(id), { ...pointer })
})

const insertNewConnector = atom(null, (get, set, { fromPin, toPin }) => {
	set(nodeIDs, (ids) => [...ids, id])
	const pointer = get(scene.documentPointer)
	set(getNodeMetadata(id), {
		type: "component",
		// componentID,
		id,
	})
	const connID = `${fromPin}->${toPin}`

	set(getConnectionMetadata(connID), { id: connID, type: "data" })
	set(getNodePosition(id), { ...pointer })
})

const addingComponentWithID = atom(null as string | null)
const addingConnectorFromPinID = atom(null as string | null)

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
					console.log(action.payload)
				}
			}
		}
		case "insertingComponent": {
			switch (action.type) {
				case "CANCELLED": {
					set(insertToolState, "insertIdle")
					set(addingComponentWithID, null)
					set(toolState, "selectTool")
					return
				}
				case "POINTER_DOWN": {
					const id = getId()
					const componentID = get(addingComponentWithID)
					set(insertToolState, "insertIdle")
					set(addingComponentWithID, null)
					set(toolState, "selectTool")
					set(insertNewComponent, {
						componentID,
						id,
					})
					set(selector.selectedNodeIDs, [id])
					return
				}

				case "POINTER_UP": {
					const { screenPointer } = get(scene.lastPointState)
					const { x, y } = get(scene.screenPointer)
					const dist = Math.hypot(x - screenPointer.x, y - screenPointer.y)
					if (dist > 20) {
						const id = getId()
						const componentID = get(addingComponentWithID)
						set(addingComponentWithID, null)
						set(insertToolState, "insertIdle")
						set(toolState, "selectTool")
						set(insertNewComponent, {
							componentID,
							id,
						})
						set(selector.selectedNodeIDs, [id])
					}
					return
				}
			}
		}
		case "insertingConnector": {
			switch (action.type) {
				case "CANCELLED": {
					set(insertToolState, "insertIdle")
					set(addingConnectorFromPinID, null)
					set(toolState, "selectTool")
					return
				}
				case "POINTER_UP_ON_PIN": {
					set(insertToolState, "insertIdle")
					set(addingConnectorFromPinID, null)
					set(toolState, "selectTool")
					console.log(action.payload)
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
	getNodePortIDs,
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
