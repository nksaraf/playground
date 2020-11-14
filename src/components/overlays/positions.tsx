import * as React from "react"
import Value from "./value"
import { useAtom } from "../../atom"
import { scene } from "../../state/scene"
import { selector } from "../../state"

function Scene() {
	const [camera] = useAtom(scene.camera)
	const [viewBox] = useAtom(scene.viewBox)

	return (
		<>
			<Value label="x">{Math.trunc(camera.x)}</Value>
			<Value label="y">{Math.trunc(camera.y)}</Value>
			<Value label="zoom">{camera.zoom.toFixed(2)}</Value>
			<div>Camera</div>

			<Value label="w">{Math.trunc(viewBox.width)}</Value>
			<Value label="h">{Math.trunc(viewBox.height)}</Value>
			<div style={{ gridColumn: "span 2" }}>View Box</div>

			<Value label="w">{Math.trunc(viewBox.width / camera.zoom)}</Value>
			<Value label="h">{Math.trunc(viewBox.height / camera.zoom)}</Value>
			<div style={{ gridColumn: "span 2" }}>Camera Frame</div>
		</>
	)
}

function Position({ atom, label }) {
	const [document] = useAtom(atom) as any

	return (
		<>
			<Value label="x">{document ? Math.trunc(document.x) : "-"}</Value>
			<Value label="y">{document ? Math.trunc(document.y) : "-"}</Value>
			<div style={{ gridColumn: "span 2" }}>{label}</div>
		</>
	)
}

function PointerPositions() {
	return (
		<>
			<Position atom={scene.documentPointer} label="Pointer (Document)" />
			<Position atom={scene.screenPointerPosition} label="Pointer (Screen)" />
			<Position
				atom={selector.selectionBrushStart}
				label="Brush start (Document)"
			/>
			<Position
				atom={selector.selectionBrushEnd}
				label="Brush end (Document)"
			/>
		</>
	)
}

export default function Positions() {
	const [viewBox] = useAtom(scene.viewBox)

	return (
		<div
			style={{
				display: "grid",
				alignItems: "baseline",
				gridTemplateColumns: "64px 64px 80px auto",
				pointerEvents: "none",
				gap: "8px",
				padding: "2px 0",
				textAlign: "left",
			}}
		>
			<Scene />
			<PointerPositions />
		</div>
	)
}
