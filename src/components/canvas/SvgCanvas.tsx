import * as React from "react";
import { useAtom } from "../../api";
import { scene } from "../../api";

export function SvgCamera({ children, ...props }) {
  const [{ x, y, zoom }] = useAtom(scene.camera);

  return (
    <g
      transform={`scale(${zoom}) translate(${-x / zoom} ${-y / zoom})`}
      strokeWidth={1 / zoom}
      {...props}
    >
      {children}
    </g>
  );
}

export function SvgCanvas({
  children,
  className = "",
  style = {},
  height,
  width,
  ...props
}) {
  return (
    <svg
      className={`absolute ${className}`}
      style={{
        height,
        width,
        userSelect: "none",
        ...style,
      }}
      viewBox={`${0} ${0} ${width} ${height}`}
      {...props}
    >
      {children}
    </svg>
  );
}
