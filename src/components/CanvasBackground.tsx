import * as React from "react"
import { useAtom } from "../atom/atom"
import { scene } from "../state/scene"

export function CanvasBackground({ children, height, width }) {
	const [{ x, y, zoom }] = useAtom(scene.camera)
	return (
		<div
			className="absolute"
			style={{
				transform: `scale(${zoom}) translateX(${-x / zoom}px) translateY(${
					-y / zoom
				}px)`,
				transformOrigin: "0px 0px",
				height,
				width,
			}}
		>
			<div className="relative">{children} </div>
		</div>
	)
}
