import * as React from "react";

export function ComponentGhost({ x, y }) {
  return (
    <rect
      x={x}
      y={y}
      width={20}
      height={20}
      fill="rgba(0,0,100, .1)"
      stroke="rgba(0,0,100, .2)"
      strokeWidth={1} />
  );
}
