import { atomFamily } from "../lib/atom"
import { graph } from "./graph"

export const getPinRawValue = atomFamily((id: string) => null)

export const getPinValue = atomFamily(
	(id: string) => (get) => {
		const metadata = get(graph.getPinMetadata(id))
		if (metadata.type === "input") {
			const connIDs = get(graph.getPinConnectionIDs(id))
			if (connIDs.length === 0) {
				return get(getPinRawValue(id))
			} else {
				const con = get(graph.getConnectionParams(connIDs[0]))
				return get(getPinRawValue(con.from))
			}
		} else {
			return get(getPinRawValue(id))
		}
	},
	(id: string) => (get, set, update) => {
		set(getPinRawValue(id), update)
	}
)

const getNodeInputValues = atomFamily((id: string) => (get) =>
	Object.fromEntries(
		get(graph.getNodeInputIDs(id)).map((id) => [
			get(graph.getPinMetadata(id)).name,
			get(getPinValue(id)),
		])
	)
)

export const compute = {
	getPinValue,
	getPinRawValue,
	getNodeInputValues,
}
