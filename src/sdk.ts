import React from "react"
import { useRecoilCallback } from "recoil"
import { NodeAtoms, useNode } from "./components/Node"
import { useAtom } from "./lib/atom"
import { graph } from "./state"
import { compute, getPinValue } from "./state/compute"

export function useUpdate(node: NodeAtoms) {
	return useRecoilCallback(
		({ snapshot, set }) => async (name, val) => {
			const outputIDs = await snapshot.getPromise(node.outputIDs)
			const id = outputIDs.find(
				(id) =>
					(snapshot.getLoadable(graph.getPinMetadata(id)).contents as any)
						.name === name
			)
			if (id) {
				set(getPinValue(id), val)
			}
		},
		[]
	)
}

export function useCompute(fn) {
	const node = useNode()
	const update = useUpdate(node)
	const [inputs] = useAtom(compute.getNodeInputValues(node.id))

	React.useEffect(() => {
		const result = fn(inputs)
		Object.keys(result).forEach((key) => {
			update(key, result[key])
		})
	}, [...Object.values(inputs), update])
}
