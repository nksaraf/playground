import * as React from "react"
import { Actions } from "./selectToolState"
import { dispatch } from "./selectToolState"
import { useUpdateAtom } from "./atom"

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
