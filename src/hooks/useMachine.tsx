import * as React from "react"
import { Actions } from "../state/select-tool"
import { dispatch } from "../state/select-tool"
import { useUpdateAtom } from "../atom/atom"

export function useMachine() {
	const send = useUpdateAtom(dispatch)
	return {
		send: React.useCallback(
			(type: Actions["type"], payload?: Actions["payload"]) => {
				send({ type, payload } as any)
			},
			[send]
		),
	}
}
