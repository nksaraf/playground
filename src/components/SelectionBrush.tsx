import * as React from "react"
import { useMachine } from "../hooks/useMachine"
import { useAtom } from "../atom/atom"
import { scene } from "../state/scene"
import { machine } from "../state"
import { IBrush } from "../../types"

export function SelectionBrush() {
	const [brush] = useAtom(scene.brush)
	const state = useMachine()
	const [selectToolState] = useAtom(machine.selectToolState)

	React.useEffect(() => {
		if (selectToolState === "recentlyPointed") {
			const i = setTimeout(() => {
				state.send("RESET_POINTED", null)
			}, 400)
			return () => {
				clearTimeout(i)
			}
		}
	}, [selectToolState, state.send])

	return selectToolState === "brushSelecting" ? <Brush {...brush} /> : null
}

export function Brush({ x0, y0, x1, y1 }: IBrush) {
	return (
		<rect
			x={Math.min(x0, x1)}
			y={Math.min(y0, y1)}
			width={Math.abs(x1 - x0)}
			height={Math.abs(y1 - y0)}
			fill="rgba(0,0,100, .1)"
			stroke="rgba(0,0,100, .2)"
			strokeWidth={1}
		/>
	)
}
