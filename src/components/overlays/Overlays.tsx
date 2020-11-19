import * as React from "react";
import { ZoomIndicator } from "./ZoomIndicator";
import { Positions } from "./Positions";
import { SelectedNodes } from "./SelectedNodes";
import { StateTree } from "./StateTree";
import { atom } from "../../api";

export function Overlays() {
  const [show, setShow] = React.useState(false);
  return (
    <>
      {show && (
        <>
          <Positions />
          <ZoomIndicator />
          <SelectedNodes />
          <StateTree />
        </>
      )}
      <button
        className="absolute"
        style={{ left: 8, bottom: 8, pointerEvents: "all" }}
        onClick={() => setShow((s) => !s)}
      >
        {show ? "Hide" : "Show"}
      </button>
    </>
  );
}
