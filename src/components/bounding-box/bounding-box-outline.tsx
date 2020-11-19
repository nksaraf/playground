import * as React from "react";
// import state from "../../../components/state"
import { IBounds } from "../../api/types";
import Corner from "./corner";
import Edge from "./edge";

function getEdges(width: number, height: number) {
  return [
    [
      [0, 0],
      [width, 0],
    ],
    [
      [width, 0],
      [width, height],
    ],
    [
      [width, height],
      [0, height],
    ],
    [
      [0, height],
      [0, 0],
    ],
  ];
}

function getCorners(width: number, height: number, offset = 0) {
  return [
    [0 - offset, 0 - offset],
    [width + offset + 1, 0 - offset],
    [width + offset + 1, height + offset + 1],
    [0 - offset, height + offset + 1],
  ];
}

export default function BoundingBox({
  x,
  y,
  width,
  height,
  zoom,
}: IBounds & { zoom: number }) {
  const offset = 1 / zoom;

  const edges = getEdges(width, height);
  const corners = getCorners(width, height);

  return (
    <g transform={`translate(${x - offset} ${y - offset})`}>
      <rect
        width={width + offset * 2}
        height={height + offset * 2}
        fill="none"
        stroke="#0274ff"
        cursor="grab"
      />
      {edges.map(([[x1, y1], [x2, y2]], i) => (
        <Edge
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          zoom={zoom}
          direction={i % 2}
          // onPointerDown={() => state.send("POINTER_DOWN_ON_BOUNDS_EDGE", i)}
        />
      ))}
      {corners.map(([cx, cy], i) => (
        <Corner
          key={i}
          x={cx}
          y={cy}
          zoom={zoom}
          direction={i % 2}
          // onPointerDown={() => state.send("POINTER_DOWN_ON_BOUNDS_CORNER", i)}
        />
      ))}
    </g>
  );
}
