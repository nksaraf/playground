import { useEffect } from "react";
import { useMachine } from "../api";

// export function handleKeyPress(e: KeyboardEvent) {
// 	if (e.key === " ")
// 		// && !state.isInAny("editingLabel", "editingArrowLabel")) {
// 		e.preventDefault()
// 	}
// }

export default function useKeyboardEvents() {
  const state = useMachine();
  useEffect(() => {
    const pressedKeys = {} as Record<string, boolean>;

    const keyDownActions = {
      Escape: "ESCAPE",
      Alt: "ENTERED_ALT_MODE",
      " ": "ENTERED_SPACE_MODE",
      Backspace: "BACKSPACE",
      Shift: "ENTERED_SHIFT_MODE",
      Control: "ENTERED_CONTROL_MODE",
      Meta: "ENTERED_META_MODE",
      // f: "SELECTED_BOX_TOOL",
      // v: "SELECTED_SELECT_TOOL",
      // r: "INVERTED_ARROWS",
      // t: "FLIPPED_ARROWS",
      // a: "STARTED_PICKING_ARROW",
    } as const;

    const keyUpActions = {
      Alt: "EXITED_ALT_MODE",
      " ": "EXITED_SPACE_MODE",
      Shift: "EXITED_SHIFT_MODE",
      Control: "EXITED_CONTROL_MODE",
      Meta: "EXITED_META_MODE",
      // v: "SELECTED_SELECT_TOOL",
      // r: "INVERTED_ARROWS",
      // t: "FLIPPED_ARROWS",
      // a: "STARTED_PICKING_ARROW",
    } as const;

    function testKeyCombo(event: any["type"], ...keys: string[]) {
      if (keys.every((key) => pressedKeys[key])) state.send(event);
    }

    function handleKeyDown(e: KeyboardEvent) {
      pressedKeys[e.key] = true;
      const action = keyDownActions[e.key];
      if (action) state.send(action);
      // Handle shift here?
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (
        pressedKeys.Option ||
        pressedKeys.Shift ||
        pressedKeys.Meta ||
        pressedKeys.Control
      ) {
        // testKeyCombo(send, "ALIGNED_LEFT", "Option", "a")
        // testKeyCombo(send, "ALIGNED_CENTER_X", "Option", "h")
        // testKeyCombo(send, "ALIGNED_RIGHT", "Option", "d")
        // testKeyCombo(send, "ALIGNED_TOP", "Option", "w")
        // testKeyCombo(send, "ALIGNED_CENTER_Y", "Option", "v")
        // testKeyCombo(send, "ALIGNED_BOTTOM", "Option", "s")
        // testKeyCombo(send, "DISTRIBUTED_X", "Option", "Control", "h")
        // testKeyCombo(send, "DISTRIBUTED_Y", "Option", "Control", "v")
        // testKeyCombo(send, "STRETCHED_X", "Option", "Shift", "h")
        // testKeyCombo(send, "STRETCHED_Y", "Option", "Shift", "v")
        // testKeyCombo(send, "BROUGHT_FORWARD", "Meta", "]")
        // testKeyCombo(send, "SENT_BACKWARD", "Meta", "[")
        // testKeyCombo(send, "BROUGHT_TO_FRONT", "Meta", "Shift", "]")
        // testKeyCombo(send, "SENT_TO_BACK", "Meta", "Shift", "[")
        testKeyCombo("PASTED", "Meta", "v");
        testKeyCombo("COPIED", "Meta", "c");
        testKeyCombo("UNDO", "Meta", "z");
        testKeyCombo("REDO", "Meta", "Shift", "z");
        return;
      } else {
        const action = keyUpActions[e.key];
        if (action) state.send(action);
      }

      pressedKeys[e.key] = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [state.send]);
}
