import React, { useState } from "react"
import { useRecoilState } from "recoil"
import { useAtom, useUpdateAtom } from "../../atom/atom"
import { graph } from "../../state/graph"
import { inputStateByID } from "./store"

export const NodeInputListItem = ({ onMouseUp, index, inputID }) => {
	const [hover, setHover] = useState(false)
	const [inputState] = useAtom(graph.getPortMetadata(inputID))
	const setOffset = useUpdateAtom(graph.getPortOffset(inputID))

	const handleOnMouseUp = (e) => {
		e.stopPropagation()
		e.preventDefault()

		onMouseUp(index)
	}

	const onMouseOver = () => {
		setHover(true)
	}

	const onMouseOut = () => {
		setHover(false)
	}

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
		<li>
			<a onClick={noop} onMouseUp={handleOnMouseUp} href={"#"}>
				<i
					ref={ref}
					className={hover ? "fa fa-circle-o hover" : "fa fa-circle-o"}
					onMouseOver={onMouseOver}
					onMouseOut={onMouseOut}
				></i>
				{inputState.name}
			</a>
		</li>
	)
}
