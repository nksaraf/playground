import * as React from "react";
import { useMachine } from "../api";

export default function useWindowEvents() {
  const state = useMachine();
  React.useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      state.send("POINTER_MOVE", { x: e.clientX, y: e.clientY });
    }

    function handlePointerUp(e: PointerEvent) {
      state.send("POINTER_UP", { x: e.clientX, y: e.clientY });
    }

    function handlePointerDown(e: PointerEvent) {
      state.send("POINTER_DOWN", { x: e.clientX, y: e.clientY });
    }

    function handleScroll() {
      state.send("SCROLLED_VIEWPORT", { x: window.scrollX, y: window.scrollY });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}
