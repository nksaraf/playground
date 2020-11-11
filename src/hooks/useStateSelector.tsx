import React from "react"
import state from "../state"

type SceneGraph = typeof state

export function useStateSelector<TKey extends keyof SceneGraph["data"]>(
	key: TKey,
	isEqual = (a, b) => a == b
): SceneGraph["data"][TKey] {
	const [data, setData] = React.useState(state.data[key])

	React.useEffect(() => {
		return state.onUpdate((next) => {
			if (!isEqual(data, next.data[key])) {
				setData(next.data[key])
			}
		})
	}, [])

	return data
}
