import * as React from "react"
import { useAtom } from "../../lib/atom"
import { scene } from "../../state/scene"
import { selector } from "../../state"

export function Value({
	label,
	children,
	style = {},
}: {
	label: string
	children: React.ReactNode
	style?: React.CSSProperties
}) {
	return (
		<div
			style={{
				fontFamily: "monospace",
				textAlign: "right",
				overflow: "hidden",
				position: "relative",
				backgroundColor: "rgba(0,0,0,.1)",
				padding: "0px 4px",
				borderRadius: 4,
				fontSize: 12,
				...style,
			}}
		>
			{children}
			<small> {label}</small>
		</div>
	)
}

export function Positions() {
	const [showPositions, setShowPositions] = React.useState(false)

	return (
		<>
			<div
				style={{
					position: "absolute",
					userSelect: "none",
					pointerEvents: "none",
					bottom: 8,
					left: 8,
				}}
			>
				{showPositions && (
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
				)}
				<button
					style={{ marginTop: 8, pointerEvents: "all" }}
					onClick={() => setShowPositions(!showPositions)}
				>
					{showPositions ? "Hide" : "Show"}
				</button>
			</div>
		</>
	)
}

function Scene() {
	const [camera] = useAtom(scene.camera)
	const [viewBox] = useAtom(scene.viewBox)

	return (
		<>
			<Value label="x">{Math.trunc(camera.x)}</Value>
			<Value label="y">{Math.trunc(camera.y)}</Value>
			<Value label="zoom">{camera.zoom.toFixed(2)}</Value>
			<div>Camera</div>

			<Value label="w">{Math.trunc(viewBox.size.width)}</Value>
			<Value label="h">{Math.trunc(viewBox.size.height)}</Value>
			<div style={{ gridColumn: "span 2" }}>View Box</div>

			<Value label="w">{Math.trunc(viewBox.size.width / camera.zoom)}</Value>
			<Value label="h">{Math.trunc(viewBox.size.height / camera.zoom)}</Value>
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
