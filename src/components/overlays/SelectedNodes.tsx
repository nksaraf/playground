import { atom, useAtom } from "../../api";
import { machine, selector } from "../../api";
import JsonOutput from "../devtools/JsonOutput";

const selectedNodeSnapshots = atom((get) =>
  get(selector.selectedNodeIDs).map((id) =>
    get(machine.snapshot.getNodeSnapshot(id))
  )
);

export function SelectedNodes() {
  const [nodeAtoms] = useAtom(selectedNodeSnapshots);

  return (
    nodeAtoms.length > 0 && (
      <div
        className="absolute overflow-scroll font-mono text-xs text-gray-500 bg-gray-300 rounded-xl p-3"
        style={{
          width: 280,
          top: 48,
          height: 320,
          right: 8,
          //@ts-ignore
          "--bg-opacity": 0.25,
        }}
      >
        <JsonOutput
          value={nodeAtoms.length > 1 ? nodeAtoms : nodeAtoms[0]}
          property={nodeAtoms.length > 1 ? "nodes" : nodeAtoms[0]?.id}
          defaultOpenDepth={10}
        />
      </div>
    )
  );
}
