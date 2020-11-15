import * as React from "react"
import { useAtom } from "../atom"
import { graph } from "../state/graph"
import { Spline } from "./Spline"

export const Connection = React.memo(
	({ connectionID }: { connectionID: string }) => {
		const [{ start, end }] = useAtom(graph.getConnectionPosition(connectionID))
		return <Spline start={start} end={end} className="connector" />
	}
)
