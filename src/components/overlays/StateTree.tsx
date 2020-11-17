import { useAtom } from "../../lib/atom"
import { stateTree } from "../../state"

function State({ state }) {
	const hasChildren = Object.keys(state.states).length > 0
	return (
		<>
			<div className={`${hasChildren ? "border p-2 rounded-md" : ""}`}>
				<div
					className={`${hasChildren ? "mb-2 font-bold" : ""} ${
						state.active ? "text-black" : "text-gray-500"
					} ${!hasChildren && state.active ? "underline" : ""}`}
				>
					{state.name}
				</div>
				{hasChildren &&
					Object.keys(state.states).map((st) => (
						<div
							className={`${
								state.states[st].active ? "text-black" : "text-gray-500"
							}`}
						>
							<State state={state.states[st]} />
						</div>
					))}
			</div>
		</>
	)
}

export function StateTree() {
	const [activeStateTree] = useAtom(stateTree)

	return (
		<div
			className="absolute font-mono text-xs bg-white rounded-xl p-3"
			style={{
				minWidth: 240,
				bottom: 36,
				right: 8,
				//@ts-ignore
				"--bg-opacity": 0.25,
			}}
		>
			<div className="flex mt-3 gap-3">
				{Object.keys(activeStateTree.states).map((st) => (
					<State state={activeStateTree.states[st]} />
				))}
			</div>
		</div>
	)
}
