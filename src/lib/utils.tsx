import { getBoxToBoxArrow, ArrowOptions } from "perfect-arrows";
import uniqueId from "lodash/uniqueId";
import { IPoint, IBounds, IFrame, IBox, IArrow } from "../api";

export let scale = 1;
export const pressedKeys = {} as Record<string, boolean>;
export const pointer = { x: 0, y: 0 };
export const origin = { x: 0, y: 0 };
export const cameraOrigin = { x: 0, y: 0 };
export const camera = { x: 0, y: 0, cx: 0, cy: 0, width: 0, height: 0 };

export const DPR = window.devicePixelRatio || 1;

export function mapValues<P, T>(
  obj: { [key: string]: T },
  fn: (value: T, index: number) => P
): { [key: string]: P } {
  return Object.fromEntries(
    Object.entries(obj).map(([id, value], index) => [id, fn(value, index)])
  );
}

export function getInitialIndex() {
  if (typeof window === undefined || !window.localStorage) return "0";

  let curIndex = "1";
  let prevIndex: any = localStorage.getItem("__index");
  if (prevIndex === null) {
    curIndex = "1";
  } else {
    const num = parseInt(JSON.parse(prevIndex), 10);
    curIndex = (num + 1).toString();
  }

  localStorage.setItem("__index", JSON.stringify(curIndex));
}

/**
 * Get an arrow between boxes.
 * @param a
 * @param b
 * @param options
 */
export function getArrow(
  a: IBox,
  b: IBox,
  options: Partial<ArrowOptions> = {}
) {
  const opts = {
    box: 0.05,
    stretchMax: 1200,
    padEnd: 12,
    ...options,
  };
  return getBoxToBoxArrow(
    a.x,
    a.y,
    a.width,
    a.height,
    b.x,
    b.y,
    b.width,
    b.height,
    opts
  );
}

export function handleKeyPress(e: KeyboardEvent) {
  if (e.key === " ") {
    // && !state.isInAny("editingLabel", "editingArrowLabel")) {
    e.preventDefault();
  }
}

export function pointInRectangle(a: IPoint, b: IFrame, padding = 0) {
  const r = padding / 2;
  return !(
    a.x > b.x + b.width + r ||
    a.y > b.y + b.height + r ||
    a.x < b.x - r ||
    a.y < b.y - r
  );
}

export function pointInCorner(a: IPoint, b: IFrame, padding = 4) {
  let cx: number, cy: number;
  const r = padding / 2;
  const corners = getCorners(b.x, b.y, b.width, b.height);

  for (let i = 0; i < corners.length; i++) {
    [cx, cy] = corners[i];
    if (
      pointInRectangle(
        a,
        {
          x: cx - 4,
          y: cy - 4,
          width: 8,
          height: 8,
        },
        0
      )
    )
      return i;
  }
}

export function lineToRectangle(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  padding = 8
) {
  const r = padding / 2;
  if (x1 < x0) [x0, x1] = [x1, x0];
  if (y1 < y0) [y0, y1] = [y1, y0];
  return {
    x: x0 - r,
    y: y0 - r,
    width: x1 + r - (x0 - r),
    height: y1 + r - (y0 - r),
  };
}

export function pointInEdge(a: IPoint, b: IFrame, padding = 4) {
  const edges = getEdges(b.x, b.y, b.width, b.height);

  for (let i = 0; i < edges.length; i++) {
    const [[x0, y0], [x1, y1]] = edges[i];
    if (pointInRectangle(a, lineToRectangle(x0, y0, x1, y1), padding)) return i;
  }
}

export function doBoxesCollide(a: IFrame, b: IFrame) {
  return !(
    a.x > b.x + b.width ||
    a.y > b.y + b.height ||
    a.x + a.width < b.x ||
    a.y + a.height < b.y
  );
}

export function getBox(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number
): IBox {
  return {
    id: "box" + uniqueId(),
    x,
    y,
    z,
    width,
    height,
    label: "",
    color: "#ffffff",
  };
}

export function getEdges(x: number, y: number, w: number, h: number) {
  return [
    [
      [x, y],
      [x + w, y],
    ],
    [
      [x + w, y],
      [x + w, y + h],
    ],
    [
      [x + w, y + h],
      [x, y + h],
    ],
    [
      [x, y + h],
      [x, y],
    ],
  ];
}

export function getCorners(x: number, y: number, w: number, h: number) {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}
