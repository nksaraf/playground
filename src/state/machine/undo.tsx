import { atom } from "../../lib/atom";
// import { graph } from "./graph"
// import { getFromWorker } from "./selector"

const undoStack = atom([]);
const redoStack = atom([]);

const saveUndoState = atom(null, (get, set) => {
  // getFromWorker("updateTree", {
  // 	boxes: current.nodes,
  // })
  // const commit = JSON.stringify(current)
  // set(redoStack, [])
  // set(undoStack, (undoSt) => [...undoSt, commit])
});

const loadUndoState = atom(null, (get, set) => {});

const loadRedoState = atom(null, (get, set) => {});

export const undo = {
  undoStack,
  redoStack,
  actions: { saveUndoState, loadUndoState, loadRedoState },
};
