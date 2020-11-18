import { atom } from "../../lib/atom";
import { scene } from "../scene";
import { selector } from "../selector";
import { uid } from "uid";
import { library } from "../library";
import { model } from "../model";
import { getNodePosition } from "../graph";
import { Actions, toolState } from "./toolState";

function getUUID() {
  return uid();
}

const addNewComponent = atom(null, (get, set, { componentID, id }) => {
  const pointer = get(scene.documentPointer);
  const { metadata, type, pins } = get(
    library.getComponentMetadata(componentID)
  );

  pins.forEach((pin, index) => {
    const i = `${id}/${pin.role}/${index}/${pin.name}`;
    set(model.getPinMetadata(i), {
      ...pin,
      index,
      id: i,
      parentNode: id,
      type: pin.role,
    });
  });

  set(model.getNodeMetadata(id), {
    type,
    componentID,
    ...metadata,
    id,
  });

  set(
    model.getNodePinIDs(id),
    pins.map((pin, index) => `${id}/${pin.role}/${index}/${pin.name}`)
  );
  set(getNodePosition(id), { ...pointer });
  set(model.nodeIDs, (ids) => [...ids, id]);
});

const addingComponentWithID = atom(null as string | null);

const addingConnectorFromPinID = atom(null as string | null);

const addNewDataConnector = atom(null, (get, set, { fromPin, toPin }) => {
  const connID = `${fromPin}->${toPin}`;
  set(model.connectionIDs, (ids) => [...ids, connID]);
  set(model.getConnectionParams(connID), { from: fromPin, to: toPin });
  set(model.getConnectionMetadata(connID), { id: connID, type: "data" });
});

const completeInsertingConnector = atom(
  null,
  (get, set, { pinID }: { pinID: string }) => {
    const fromPin = get(addingConnectorFromPinID);

    set(
      addNewDataConnector,
      get(model.getPinMetadata(fromPin)).type === "output"
        ? {
            fromPin,
            toPin: pinID,
          }
        : {
            toPin: fromPin,
            fromPin: pinID,
          }
    );
  }
);

const insertToolState = atom(
  "insertIdle" as "insertIdle" | "insertingComponent" | "insertingConnector"
);

const insertToolDispatch = atom(null, (get, set, action: Actions) => {
  switch (get(insertToolState)) {
    case "insertIdle": {
      switch (action.type) {
        case "POINTER_DOWN_ON_COMPONENT_BUTTON": {
          set(addingComponentWithID, action.payload.componentID);
          set(insertToolState, "insertingComponent");
          return;
        }
        case "POINTER_DOWN_ON_PIN": {
          set(addingConnectorFromPinID, action.payload.pinID);
          set(insertToolState, "insertingConnector");
        }
      }
    }
    case "insertingComponent": {
      switch (action.type) {
        case "ESCAPE": {
          set(insertToolState, "insertIdle");
          set(addingComponentWithID, null);
          set(toolState, "selectTool");
          return;
        }
        case "POINTER_DOWN": {
          const id = getUUID();
          const componentID = get(addingComponentWithID);
          set(addNewComponent, {
            componentID,
            id,
          });
          set(selector.selectedNodeIDs, [id]);
          set(insertToolState, "insertIdle");
          set(addingComponentWithID, null);
          set(toolState, "selectTool");
          return;
        }

        case "POINTER_UP": {
          const { screenPointer } = get(scene.lastPointState);
          const { x, y } = get(scene.screenPointer);
          const dist = Math.hypot(x - screenPointer.x, y - screenPointer.y);
          if (dist > 20) {
            const id = getUUID();
            const componentID = get(addingComponentWithID);
            set(addNewComponent, {
              componentID,
              id,
            });
            set(selector.selectedNodeIDs, [id]);
            set(addingComponentWithID, null);
            set(insertToolState, "insertIdle");
            set(toolState, "selectTool");
          }
          return;
        }
      }
    }
    case "insertingConnector": {
      switch (action.type) {
        case "ESCAPE": {
          set(insertToolState, "insertIdle");
          set(addingConnectorFromPinID, null);
          set(toolState, "selectTool");
          return;
        }
        case "POINTER_DOWN_ON_CANVAS": {
          set(insertToolState, "insertIdle");
          set(addingConnectorFromPinID, null);
          set(toolState, "selectTool");
          return;
        }
        case "POINTER_UP_ON_PIN": {
          const fromPin = get(addingConnectorFromPinID);
          if (fromPin === action.payload.pinID) {
          } else if (
            get(model.getPinMetadata(fromPin)).parentNode ===
              get(model.getPinMetadata(action.payload.pinID)).parentNode ||
            get(model.getPinMetadata(fromPin)).type ===
              get(model.getPinMetadata(action.payload.pinID)).type
          ) {
          } else {
            set(completeInsertingConnector, action.payload);
            set(insertToolState, "insertIdle");
            set(addingConnectorFromPinID, null);
            set(toolState, "selectTool");
          }
          return;
        }
      }
    }
  }
});

export const insertTool = {
  state: insertToolState,
  dispatch: insertToolDispatch,
  addingComponentWithID,
  addingConnectorFromPinID,
};
