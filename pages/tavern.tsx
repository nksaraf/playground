import Head from "next/head"
import React, { useState } from "react"
import { RecoilRoot, useSetRecoilState } from "recoil"
import { NodeGraph } from "../src/graph/NodeGraph"

import { exampleGraph, writeGraph } from "../src/graph/exampleGraph"

function Graph() {
	const write = useSetRecoilState(writeGraph)
	React.useEffect(() => {
		write(exampleGraph)
	}, [write])

	return <NodeGraph />
}

export default function Index() {
	return (
		<RecoilRoot>
			<Graph />
		</RecoilRoot>
	)
}
