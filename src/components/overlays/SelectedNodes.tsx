import { atom, useAtom } from "../../lib/atom"
import { selector } from "../../state"
import { snapshot } from "../../state/snapshot"
import JsonOutput from "../devtools/JsonOutput"

const selectedNodeSnapshots = atom((get) =>
	get(selector.selectedNodeIDs).map((id) => get(snapshot.getNodeSnapshot(id)))
)

export function SelectedNodes() {
	const [nodeAtoms] = useAtom(selectedNodeSnapshots)

	return (
		nodeAtoms.length > 0 && (
			<div
				className="absolute font-mono text-xs bg-white rounded-xl p-3"
				style={{
					minWidth: 240,
					top: 48,
					right: 8,
					//@ts-ignore
					"--bg-opacity": 0.45,
				}}
			>
				<JsonOutput
					value={nodeAtoms.length > 1 ? nodeAtoms : nodeAtoms[0]}
					property={nodeAtoms.length > 1 ? "nodes" : nodeAtoms[0]?.id}
				/>
			</div>
		)
	)
}
