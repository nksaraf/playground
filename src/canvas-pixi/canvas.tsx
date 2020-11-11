import * as React from "react"
import { memo, useRef, useEffect } from "react"
import Surface from "./surface"
import state from "../state"
import { styled } from "../theme"
import * as PIXI from "pixi.js"

const dpr = window.devicePixelRatio || 1

let app: PIXI.Application

const CanvasBackground = styled.div({
	width: "100vw",
	height: "100vh",
	overflow: "hidden",
	bg: "$canvas",
})

type Props = React.HTMLProps<HTMLCanvasElement> & {
	width: number
	height: number
}

function Canvas({ width, height, ...rest }: Props) {
	const rSurface = useRef<Surface>()
	const rBackground = useRef<HTMLDivElement>(null)
	const rCanvas = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (rSurface.current) rSurface.current.destroy()
		const canvas = rCanvas.current
		const bg = rBackground.current
		if (!(canvas && bg)) return

		app = new PIXI.Application({
			resolution: window.devicePixelRatio,
			view: canvas,
		})

		app.resizeTo = bg
		app.resize()

		rSurface.current = new Surface(canvas, app)
		state.send("UPDATED_SURFACE", rSurface.current)
	}, [rCanvas])

	useEffect(() => {
		app.resize()
	}, [width, height])

	function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
		const { deltaX, deltaY } = e

		if (e.ctrlKey) {
			// Zooming
			state.send("ZOOMED", deltaY / 100)
			state.send("MOVED_POINTER")
		} else {
			// Panning
			state.send("PANNED", {
				x: deltaX,
				y: deltaY,
			})
			state.send("MOVED_POINTER")
		}
	}

	return (
		<CanvasBackground
			ref={rBackground}
			onWheel={handleWheel}
			onPointerDown={(e) => {
				const surface = rSurface.current
				if (!surface) return

				const { hit } = surface

				switch (hit.type) {
					case "bounds": {
						state.send("STARTED_POINTING_BOUNDS")
						break
					}
					case "box": {
						state.send("STARTED_POINTING_BOX", { id: hit.id })
						break
					}
					case "bounds-corner": {
						state.send("STARTED_POINTING_BOUNDS_CORNER", hit.corner)
						break
					}
					case "bounds-edge": {
						state.send("STARTED_POINTING_BOUNDS_EDGE", hit.edge)
						break
					}
					case "canvas": {
						state.send("STARTED_POINTING_CANVAS")
						break
					}
				}
			}}
			onPointerMove={(e) =>
				state.send("MOVED_POINTER", { x: e.clientX, y: e.clientY })
			}
			onPointerUp={(e) =>
				state.send("STOPPED_POINTING", { x: e.clientX, y: e.clientY })
			}
		>
			<canvas
				ref={rCanvas}
				width={width * dpr}
				height={height * dpr}
				style={{
					transformOrigin: "top left",
					transform: `scale(${1 / dpr})`,
				}}
			/>
		</CanvasBackground>
	)
}

export default memo(Canvas)
