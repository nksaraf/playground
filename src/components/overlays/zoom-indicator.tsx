import { useAtom } from "../../atom/atom"
import * as React from "react"
import { scene } from "../../state/scene"

export default function ZoomIndicator() {
	const [zoom] = useAtom(scene.cameraZoom)

	return (
		<span
			style={{
				position: "absolute",
				bottom: 8,
				right: 8,
				padding: "4px 12px",
				textAlign: "right",
			}}
		>
			{Math.trunc(zoom * 100)}%
		</span>
	)
}
