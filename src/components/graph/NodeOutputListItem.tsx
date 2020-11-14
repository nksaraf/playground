import React from "react"
import { useRecoilState } from "recoil"
import { useAtom, useUpdateAtom } from "../../atom/atom"
import { graph } from "../../state/graph"
import { outputStateByID } from "./store"

export const NodeOutputListItem = ({ onMouseDown, index, outputID }) => {
	const handleOnMouseDown = (e) => {
		e.stopPropagation()
		e.preventDefault()

		onMouseDown(index)
	}

	const setOffset = useUpdateAtom(graph.getPortOffset(outputID))

	const [outputState] = useAtom(graph.getPortMetadata(outputID))

	const noop = (e) => {
		e.stopPropagation()
		e.preventDefault()
	}

	const ref = React.useRef<HTMLLIElement>()

	React.useLayoutEffect(() => {
		setOffset({
			x: ref.current?.offsetLeft,
			y: ref.current?.offsetTop,
		})
	}, [])

	return (
		<li ref={ref} onMouseDown={handleOnMouseDown}>
			<a href={"#"} onClick={noop}>
				{outputState.name}
				<i className={"fa fa-circle-o"}></i>
			</a>
		</li>
	)
}
