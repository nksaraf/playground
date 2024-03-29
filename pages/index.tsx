import dynamic from "next/dynamic"
import React from "react"
import Head from "next/head"

const App = dynamic(() => import("../src/components/Tavern"), {
	ssr: false,
})

export default function Home() {
	return (
		<>
			<Head>
				<title>Tavern</title>
			</Head>
			<App />
		</>
	)
}
