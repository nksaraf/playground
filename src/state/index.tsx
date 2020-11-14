import uniqueId from "lodash/uniqueId"
import { v4 as uuid } from "uuid"

// let surface: Surface | undefined = undefined
const id = uuid()

function getId() {
	return uniqueId(id)
}

export * from "./machine"
export * from "./graph"
export * from "./scene"
export * from "./selector"
export * from "./undo"
export * from "../hooks/useMachine"
