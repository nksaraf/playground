import * as React from "react"
import { ButtonWrapper, ShortcutHint, Button } from "./styled"
import * as Icons from "./icons/svgr"
import { useMachine } from "../../hooks/useMachine"

type IconButtonProps = {
	// event: string
	isActive?: boolean
	src: string
	shortcut?: string
} & React.HTMLProps<HTMLButtonElement>

export default function IconButton({
	// event = "",
	isActive = false,
	src,
	shortcut,
	children,
	onClick,
	...props
}: IconButtonProps) {
	const Icon = Icons[src]
	const state = useMachine()

	return (
		<ButtonWrapper>
			<Button
				disabled={props.disabled}
				status={isActive ? "active" : ""}
				type="button"
				onClick={onClick}
			>
				<Icon />
			</Button>
			{shortcut && <ShortcutHint>{shortcut}</ShortcutHint>}
		</ButtonWrapper>
	)
}