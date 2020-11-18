import * as React from "react";
import { useAtom } from "../../lib/atom";
import { scene } from "../../state";

export function Camera({ children }) {
  const [{ x, y, zoom }] = useAtom(scene.camera);

  return (
    <g
      transform={`scale(${zoom}) translate(${-x / zoom} ${-y / zoom})`}
      strokeWidth={1 / zoom}
    >
      {children}
    </g>
  );
}

export function SvgCanvas({ children, height, width }) {
  const [viewBoxSize] = useAtom(scene.viewBoxSize);
  return (
    <svg
      className="absolute"
      style={{
        height,
        width,
        userSelect: "none",
      }}
      viewBox={`${0} ${0} ${viewBoxSize.width} ${viewBoxSize.height}`}
    >
      <Camera>{children}</Camera>
    </svg>
  );
}
