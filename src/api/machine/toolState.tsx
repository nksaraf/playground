import { IFrame, IPoint } from "../types";
import { atom } from "../state/atom";

export type Action<S, T = undefined> = {
  type: S;
  payload: T;
};

export type Actions =
  | Action<"UPDATED_VIEWBOX", IFrame>
  | Action<"POINTER_MOVE", IPoint | undefined>
  | Action<"POINTER_DOWN_ON_COMPONENT_BUTTON", { componentID: string }>
  | Action<"POINTER_DOWN_ON_PIN", { pinID: string }>
  | Action<"POINTER_UP_ON_PIN", { pinID: string }>
  // | Action<"POINTER_DOWN_ON_BOUNDS_EDGE">
  // | Action<"POINTER_DOWN_ON_BOUNDS_CORNER">
  | Action<"POINTER_DOWN_ON_CANVAS">
  | Action<"POINTER_DOWN_ON_NODE", { id: string }>
  | Action<"POINTER_DOWN_ON_BOUNDS">
  | Action<"POINTER_UP">
  | Action<"FORCED_IDS">
  | Action<"STOP_WAITING_FOR_DOUBLE_PRESS">
  | Action<"UNDO">
  | Action<"REDO">
  | Action<"POINTER_DOWN">
  | Action<"DOUBLE_TAPPED_CANVAS">
  | Action<"ZOOMED", number>
  | Action<"PANNED", IPoint>
  | Action<"SCROLLED_VIEWPORT", IPoint>
  | Action<"ESCAPE">
  | Action<"BACKSPACE">
  | Action<"ENTERED_ALT_MODE">
  | Action<"ENTERED_SPACE_MODE">
  | Action<"ENTERED_SHIFT_MODE">
  | Action<"ENTERED_CONTROL_MODE">
  | Action<"ENTERED_META_MODE">
  | Action<"EXITED_ALT_MODE">
  | Action<"EXITED_SPACE_MODE">
  | Action<"EXITED_SHIFT_MODE">
  | Action<"EXITED_CONTROL_MODE">
  | Action<"EXITED_META_MODE">
  | Action<"PASTED">
  | Action<"COPIED">;

export const toolState = atom("selectTool");
