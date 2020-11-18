import { atom } from "../../lib/atom";
import { scene } from "../scene";
import { graph } from "../graph";
import { model } from "../model";
import { selector } from "../selector";
import flatten from "lodash/flatten";
import * as Comlink from "comlink";
import { Actions } from "./toolState";
import { undo } from "./undo";

type GetFromWorker = (type: string, payload: any) => Promise<any>;

export const getFromWorker = Comlink.wrap<GetFromWorker>(
  new Worker("service.worker.js")
);

const moveDraggingBoxes = atom(null, (get, set) => {
  const pointer = get(scene.screenPointer);
  get(selector.selectedNodeIDs).forEach((id) => {
    set(graph.getNodePosition(id), (pos) => ({
      x: pos.x + pointer.dx,
      y: pos.y + pointer.dy,
    }));
  });
});

const clearSelection = atom(null, (get, set) => {
  set(selector.selectedConnectionIDs, []);
  set(selector.selectedNodeIDs, []);
  set(selector.focusedNode, null);
});

const deleteSelected = atom(null, (get, set) => {
  const selectedIDs = get(selector.selectedNodeIDs);
  const connectionIDs = flatten([
    ...selectedIDs.map((id) => get(model.getNodeConnectionIDs(id))),
    get(selector.selectedConnectionIDs),
  ]);

  set(clearSelection);

  set(model.nodeIDs, (ids) => ids.filter((id) => !selectedIDs.includes(id)));

  set(model.connectionIDs, (ids) =>
    ids.filter((id) => !connectionIDs.includes(id))
  );
});

const startBrushWithWorker = atom(null, (get, set) => {
  const { x, y } = get(scene.documentPointer);

  const { documentPointer } = get(scene.lastPointState);
  set(selector.selectionBrushStart, { ...documentPointer });
  set(selector.selectionBrushEnd, { x, y });

  getFromWorker("selecter", {
    origin: { x, y },
  });
});
const initialSelectedNodeIDs = atom([]);

const setInitialSelectedIDs = atom(null, (get, set) => {
  set(initialSelectedNodeIDs, [...get(selector.selectedNodeIDs)]);
});

const moveBrush = atom(null, (get, set) => {
  set(selector.selectionBrushEnd, { ...get(scene.documentPointer) });
});

const completeBrush = atom(null, (get, set) => {
  set(selector.selectionBrushStart, null);
  set(selector.selectionBrushEnd, null);
});

const setSelectedIdsFromWorker = atom(null, (get, set) => {
  getFromWorker("selected", get(scene.documentPointer)).then((r) => {
    if (r.length !== get(selector.selectedNodeIDs).length) {
      set(selector.selectedNodeIDs, r);
    }
  });
});

const selectToolState = atom(
  "selectingIdle" as
    | "selectingIdle"
    | "dragging"
    | "inserting"
    | "edgeResizing"
    | "cornerResizing"
    | "pointingCanvas"
    | "brushSelecting"
    | "waitingForDoublePress"
);

const selectToolDispatch = atom(null, (get, set, action: Actions) => {
  switch (get(selectToolState)) {
    case "selectingIdle": {
      switch (action.type) {
        case "ESCAPE": {
          set(clearSelection);
          return;
        }
        case "BACKSPACE": {
          set(undo.actions.saveUndoState);
          if (get(selector.focusedNode) === null) {
            set(deleteSelected);
          }
          set(undo.actions.saveUndoState);
          return;
        }
        case "POINTER_DOWN_ON_CANVAS": {
          set(selectToolState, "pointingCanvas");
          return;
        }
        case "POINTER_DOWN_ON_NODE": {
          if (!get(selector.getNodeIsSelected(action.payload.id))) {
            set(selector.selectedNodeIDs, [action.payload.id]);
          }
          set(selectToolState, "dragging");
          return;
        }
        case "POINTER_DOWN_ON_BOUNDS": {
          set(selectToolState, "dragging");

          return;
        }
      }
      return;
    }
    case "dragging": {
      switch (action.type) {
        case "POINTER_MOVE": {
          set(moveDraggingBoxes);
          return;
        }
        case "POINTER_UP": {
          set(selectToolState, "selectingIdle");
          return;
        }
      }
      return;
    }

    case "pointingCanvas": {
      switch (action.type) {
        case "POINTER_MOVE": {
          const { screenPointer: initial, camera } = get(scene.lastPointState);
          const pointer = get(scene.screenPointerPosition);

          set(scene.cameraPosition, {
            x: camera.x - (pointer.x - initial.x),
            y: camera.y - (pointer.y - initial.y),
          });

          return;
        }
        case "POINTER_UP": {
          set(clearSelection);
          set(selectToolState, "waitingForDoublePress");
          return;
        }
      }
      return;
    }
    case "waitingForDoublePress": {
      switch (action.type) {
        case "POINTER_DOWN_ON_CANVAS": {
          set(selectToolState, "brushSelecting");
          set(clearSelection);
          set(startBrushWithWorker);
          set(setInitialSelectedIDs);
          return;
        }
        case "STOP_WAITING_FOR_DOUBLE_PRESS": {
          set(selectToolState, "selectingIdle");
          return;
        }
      }
      return;
    }
    case "brushSelecting": {
      switch (action.type) {
        case "POINTER_MOVE": {
          set(moveBrush);
          set(setSelectedIdsFromWorker);
          return;
        }
        case "POINTER_UP": {
          set(completeBrush);
          set(selectToolState, "selectingIdle");
          return;
        }
      }
      return;
    }
  }
});

export const selectTool = {
  state: selectToolState,
  dispatch: selectToolDispatch,
  initialSelectedNodeIDs,
};
