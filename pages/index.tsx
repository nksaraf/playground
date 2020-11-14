import dynamic from "next/dynamic"
import React from "react"
import { RecoilRoot } from "recoil"

const App = dynamic(() => import("../src/app"), {
	ssr: false,
})

export default function Home() {
	return (
		<RecoilRoot>
			<App />
		</RecoilRoot>
	)
}
