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

const getPinConnectionIDs = atomFamily((id: string) => [])

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

const addingComponentWithID = atom(null as string | null)

export const insertToolDispatch = atom(null, (get, set, action: Actions) => {
	switch (get(insertToolState)) {
		case "insertIdle": {
			switch (action.type) {
				case "POINTER_DOWN_ON_COMPONENT_BUTTON": {
					set(insertToolState, "insertingComponent")
					set(addingComponentWithID, action.payload.componentID)
					return
				}
			}
		}
		case "insertingComponent": {
			switch (action.type) {
				case "CANCELLED": {
					set(toolState, "selectTool")
					return
				}
				case "POINTER_DOWN": {
					const id = getId()
					set(toolState, "selectTool")
					set(insertNewComponent, {
						componentID: get(addingComponentWithID),
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
						set(toolState, "selectTool")
						set(insertNewComponent, {
							componentID: get(addingComponentWithID),
							id,
						})
						set(selector.selectedNodeIDs, [id])
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
	getNodePortIDs,
	getNodeConnectionIDs,
	getPinMetadata,
	getPinConnectionIDs,
	getNodeSize,
	getNodeInputIDs,
	getNodeOutputIDs,
	snapshot,
	getPinOffset,
	getPinPosition,
	getConnectionPosition,
	insertToolState,
}
