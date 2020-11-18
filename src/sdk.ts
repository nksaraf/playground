import React from "react"
import { useRecoilCallback } from "recoil"
import { NodeAtoms, useNode } from "./components/Node"
import { useAtom } from "./lib/atom"
import { compute, graph, model } from "./state"

export function useUpdate(node: NodeAtoms) {
	return useRecoilCallback(
		({ snapshot, set }) => async (name, val) => {
			const outputIDs = await snapshot.getPromise(node.outputIDs)
			const id = outputIDs.find(
				(id) =>
					(snapshot.getLoadable(model.getPinMetadata(id)).contents as any)
						.name === name
			)
			if (id) {
				set(compute.getPinValue(id), val)
			}
		},
		[]
	)
}

export function useUpdateEffect(
	fn: (update: (output: string, val: any) => void) => void,
	deps: any[] = []
) {
	const node = useNode()
	const update = useUpdate(node)
	React.useEffect(() => {
		fn(update)
	}, [update, ...deps])
}

export function useCompute(fn: (inputs: any) => any, deps = []) {
	const node = useNode()
	const update = useUpdate(node)
	const [inputs] = useAtom(node.inputValues)

	React.useEffect(() => {
		const result = fn(inputs)
		Object.keys(result).forEach((key) => {
			update(key, result[key])
		})
	}, [...Object.values(inputs), update, ...deps])
}

export function useNodeState(key, defaultValue?: any) {
	const node = useNode()

	const [state, setState] = useAtom(node.state)
	return [
		state[key] ?? defaultValue,
		React.useCallback(
			(val) =>
				setState((oldVal) => ({
					...oldVal,
					[key]: typeof val === "function" ? val(oldVal[key]) : val,
				})),
			[setState]
		),
	] as const
}
