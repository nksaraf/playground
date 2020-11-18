import { atom, atomFamily } from "../../lib/atom";
import { Actions, toolState } from "./toolState";
import { selector } from "../selector";
import { scene } from "../scene";

import { IFrame, IPoint } from "../../../types";
import { undo } from "./undo";
import { StateTreeNode } from "../../lib/logger";
import clamp from "lodash/clamp";
import { snapshot } from "./snapshot";

import { selectTool } from "./select";
import { insertTool } from "./insert";

const updatePointerOnPointerMove = atom(null, (get, set, point: IPoint) => {
  if (!point) return; // Probably triggered by a zoom / scroll

  const zoom = get(scene.cameraZoom);
  const oldPos = get(scene.screenPointerPosition);
  set(scene.screenPointerPosition, point);
  set(scene.screenPointerDelta, {
    dx: (point.x - oldPos.x) / zoom,
    dy: (point.y - oldPos.y) / zoom,
  });
});

const updatePointerOnPan = atom(null, (get, set, delta: IPoint) => {
  const zoom = get(scene.cameraZoom);
  set(scene.screenPointerDelta, { dx: delta.x / zoom, dy: delta.y / zoom });
});

const updateCameraPoint = atom(null, (get, set, delta: IPoint) => {
  set(scene.cameraPosition, (pos) => ({
    x: pos.x + delta.x,
    y: pos.y + delta.y,
  }));
});

const updateViewBoxOnScroll = atom(null, (get, set, point: IPoint) => {
  const { scrollX, scrollY } = get(scene.viewBoxScroll);

  set(scene.viewBoxPosition, (pos) => ({
    x: pos.x + scrollX - point.x,
    y: pos.y + scrollY - point.y,
  }));

  set(scene.viewBoxScroll, {
    scrollX: point.x,
    scrollY: point.y,
  });
});

const updateCameraOnViewBoxChange = atom(null, (get, set, frame: IFrame) => {
  const viewBox = get(scene.viewBoxSize);
  // if (viewBox.width > 0) {
  // 	// set(cameraPosition, (pos) => ({
  // 	// 	x: pos.x + (viewBox.width - frame.width) / 2,
  // 	// 	y: pos.y + (viewBox.height - frame.height) / 2,
  // 	// }))
  // }
});

const updateViewBox = atom(null, (get, set, frame: IFrame) => {
  set(scene.viewBoxPosition, { x: frame.x, y: frame.y });
  set(scene.viewBoxSize, { height: frame.height, width: frame.width });
});

const updateCameraZoom = atom(null, (get, set, newZoom: number) => {
  const prev = get(scene.cameraZoom);
  const next = clamp(prev - newZoom, 0.25, 100);
  const delta = next - prev;
  const pointer = get(scene.screenPointerPosition);

  set(scene.cameraZoom, next);
  set(scene.cameraPosition, (pos) => ({
    x: pos.x + ((pos.x + pointer.x) * delta) / prev,
    y: pos.y + ((pos.y + pointer.y) * delta) / prev,
  }));
});

const savePointer = atom(null, (get, set) => {
  set(scene.lastPointState, {
    screenPointer: get(scene.screenPointer),
    documentPointer: get(scene.documentPointer),
    viewBox: get(scene.viewBox),
    camera: get(scene.camera),
  });
});

const globalDispatch = atom(null, (get, set, action: Actions) => {
  switch (action.type) {
    case "FORCED_IDS": {
      return set(selector.selectedNodeIDs, action.payload as any);
    }
    // case "RESET_BOXES": "resetBoxes",
    case "UNDO": {
      return set(undo.actions.loadUndoState, null);
    }
    case "REDO": {
      return set(undo.actions.loadRedoState, null);
    }
    case "POINTER_DOWN": {
      return set(savePointer, action.payload);
    }
    case "POINTER_DOWN_ON_COMPONENT_BUTTON": {
      set(insertTool.dispatch, action);
      set(toolState, "insertTool");
      return;
    }
    case "POINTER_DOWN_ON_PIN": {
      set(insertTool.dispatch, action);
      set(toolState, "insertTool");
      return;
    }
    // case "POINTER_DOWN_ON_COMPONENT_BUTTON": {
    // 	set(toolState, "insertTool")
    // 	set(insertTool.dispatch, action)
    // 	return
    // }
    case "POINTER_MOVE":
      return set(updatePointerOnPointerMove, action.payload);
    case "ZOOMED":
      return set(updateCameraZoom, action.payload);
    case "PANNED": {
      set(updateCameraPoint, action.payload);
      set(updatePointerOnPan, action.payload);
      return;
    }
    case "SCROLLED_VIEWPORT":
      return set(updateViewBoxOnScroll, action.payload);
    case "UPDATED_VIEWBOX": {
      set(updateCameraOnViewBoxChange, action.payload);
      set(updateViewBox, action.payload);
      return;
    }
  }
});

const states = {
  selectTool: selectTool.state,
  insertTool: insertTool.state,
};

const activeState = atom((get) => {
  return `${get(toolState)}.${get(states[get(toolState)])}`;
});

const stateTree = atom<StateTreeNode>((get) => {
  return {
    name: "root",
    active: true,
    states: {
      selectTool: {
        name: "selectTool",
        active: get(toolState) === "selectTool",
        states: {
          selectingIdle: {
            name: "selectingIdle",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "selectingIdle",
            states: {},
          },
          dragging: {
            name: "dragging",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "dragging",
            states: {},
          },
          inserting: {
            name: "inserting",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "inserting",
            states: {},
          },
          edgeResizing: {
            name: "edgeResizing",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "edgeResizing",
            states: {},
          },
          cornerResizing: {
            name: "cornerResizing",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "cornerResizing",
            states: {},
          },
          pointingCanvas: {
            name: "pointingCanvas",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "pointingCanvas",
            states: {},
          },
          brushSelecting: {
            name: "brushSelecting",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "brushSelecting",
            states: {},
          },
          waitingForDoublePress: {
            name: "waitingForDoublePress",
            active:
              get(toolState) === "selectTool" &&
              get(selectTool.state) === "waitingForDoublePress",
            states: {},
          },
        },
      },
      insertTool: {
        name: "insertTool",
        active: get(toolState) === "insertTool",
        states: {
          insertIdle: {
            name: "insertIdle",
            active:
              get(toolState) === "insertTool" &&
              get(insertTool.state) === "insertIdle",
            states: {},
          },
          insertingConnector: {
            name: "insertingConnector",
            active:
              get(toolState) === "insertTool" &&
              get(insertTool.state) === "insertingConnector",
            states: {},
          },
          insertingComponent: {
            name: "insertingComponent",
            active:
              get(toolState) === "insertTool" &&
              get(insertTool.state) === "insertingComponent",
            states: {},
          },
        },
      },
    },
  };
});

const dispatch = atom(null, (get, set, action: Actions) => {
  set(globalDispatch, action);
  switch (get(toolState)) {
    case "selectTool": {
      set(selectTool.dispatch, action);
      break;
    }
    case "insertTool": {
      set(insertTool.dispatch, action);
      break;
    }
  }
});

export * from "./toolState";

export const machine = {
  dispatch,
  insertTool,
  selectTool,
  undo,
  snapshot,
  stateTree,
  activeState,
};
