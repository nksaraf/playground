import { useAtom } from "../../lib/atom"
import { machine } from "../../state"

function State({ state }) {
	const hasChildren = Object.keys(state.states).length > 0
	return (
		<>
			<div>
				<div
					className={`${hasChildren ? "mb-1 ml-3 font-bold" : ""} ${
						state.active ? "text-gray-800" : "text-gray-400"
					} 
					`}
					// ${!hasChildren && state.active ? "underline" : ""}
				>
					{state.name}
				</div>
				{hasChildren && (
					<div
						className={`${
							hasChildren
								? `border-2 p-2 rounded-md ${
										state.active ? "border-gray-800" : "border-gray-400"
								  }`
								: ""
						}`}
					>
						{Object.keys(state.states).map((st) => (
							<div
								key={state.states[st].name}
								className={`${
									state.states[st].active ? "text-gray-800" : "text-gray-400"
								} `}
							>
								<State state={state.states[st]} />
							</div>
						))}
					</div>
				)}
			</div>
		</>
	)
}

export function StateTree() {
	const [activeStateTree] = useAtom(machine.stateTree)

	return (
		<div
			className="absolute font-mono text-xs rounded-xl"
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
					<State
						key={activeStateTree.states[st].name}
						state={activeStateTree.states[st]}
					/>
				))}
			</div>
		</div>
	)
}
