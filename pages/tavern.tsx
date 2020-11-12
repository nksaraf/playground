import React from "react"
import { NodeGraph } from "../src/graph/NodeGraph"
import { Provider } from "jotai"
import { exampleGraph, writeGraph } from "../src/state/graph-io"
import { useUpdateAtom } from "../src/state/atom"

function Graph() {
	const write = useUpdateAtom(writeGraph)
	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	return <NodeGraph />
}

export default function Index() {
	return (
		// <RecoilRoot>
		<Provider>
			<Graph />
		</Provider>
		// </RecoilRoot>
	)
}
