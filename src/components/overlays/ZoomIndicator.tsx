import { useAtom } from "../../api";
import * as React from "react";
import { scene } from "../../api";

export function ZoomIndicator() {
  const [zoom] = useAtom(scene.cameraZoom);

  return (
    <span
      style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        textAlign: "right",
      }}
    >
      {Math.trunc(zoom * 100)}%
    </span>
  );
}
