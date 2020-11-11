import React from "react"
import { Spline } from "./Spline"
import { selectorFamily, useRecoilValue } from "recoil"
import {
	connectionParamsByID,
	nodePositionByID,
	inputStateByID,
	outputStateByID,
} from "./store"
import { computeOutOffsetByIndex, computeInOffsetByIndex } from "./utils"

export const connectionPositionByID = selectorFamily({
	key: "connectionPosition",
	get: (id) => ({ get }) => {
		const params = get(connectionParamsByID(id))

		const fromNode = get(nodePositionByID(params.fromNode))
		const toNode = get(nodePositionByID(params.toNode))

		const toField = get(inputStateByID(params.inputField))
		const fromField = get(outputStateByID(params.outputField))

		let splinestart = computeOutOffsetByIndex(
			fromNode.x,
			fromNode.y,
			fromField.index
		)
		let splineend = computeInOffsetByIndex(toNode.x, toNode.y, toField.index)

		return { start: splinestart, end: splineend }
	},
})

function useConnectionPosition(connectionID: string) {
	const { start, end } = useRecoilValue(connectionPositionByID(connectionID))
	return { start, end }
}

export const Connection = React.memo(
	({ connectionID }: { connectionID: string }) => {
		const { start, end } = useConnectionPosition(connectionID)

		return <Spline start={start} end={end} />
	}
)
