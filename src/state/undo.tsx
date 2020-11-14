import { atom } from "../atom"
import { saveToDatabase } from "./database"
import { graph } from "./graph"
import { getFromWorker } from "./selector"

// let selecter: BoxSelecter | undefined
// let resizer: BoxTransforms.EdgeResizer | BoxTransforms.CornerResizer | undefined
const undoStack = atom([])
const redoStack = atom([])

const saveUndoState = atom(null, (get, set) => {
	const current = get(graph.snapshot)

	getFromWorker("updateTree", {
		boxes: current.nodes,
	})

	const commit = JSON.stringify(current)

	set(redoStack, [])
	set(undoStack, (undoSt) => [...undoSt, commit])
	saveToDatabase(commit)
})

const loadUndoState = atom(null, (get, set) => {})

const loadRedoState = atom(null, (get, set) => {})

export const undo = {
	undoStack,
	redoStack,
	actions: { saveUndoState, loadUndoState, loadRedoState },
}
