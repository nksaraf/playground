import { atomFamily, atom } from "recoil"
import { IPoint } from "../types"

export const nodeIDs = atom({
	key: "nodeIDs",
	default: [],
})

export const connectionIDs = atom({
	key: "connectionIDs",
	default: [],
})

export const connectionParamsByID = atomFamily({
	key: "connectionParams",
	default: (param) => ({
		fromNode: "",
		toNode: "",
		inputField: "",
		outputField: "",
	}),
})

export const nodePositionByID = atomFamily<IPoint, string>({
	key: "nodePosition",
	default: (param) => ({ x: 100, y: 100 }),
})

export const inputIDsByNodeID = atomFamily<string[], string>({
	key: "inputIDsByNode",
	default: (param) => [],
})

export const inputStateByID = atomFamily({
	key: "inputState",
	default: (param) => ({ name: "input", parentNode: null, index: -1 }),
})

export const outputStateByID = atomFamily({
	key: "outputState",
	default: (param) => ({ name: "input", parentNode: null, index: -1 }),
})

export const outputIDsByNodeID = atomFamily({
	key: "outputIDsByNode",
	default: (param) => [],
})

export const nodeTypeByID = atomFamily({
	key: "nodeType",
	default: (param) => "Hello",
})
