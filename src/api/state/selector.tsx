import { IBounds, IFrame, IPoint } from "./types";
import { atom, atomFamily } from "./atom";
import * as graph from "./graph";

function getBoundingBox(boxes: IFrame[]): IBounds {
    if (boxes.length === 0) {
        return {
            x: 0,
            y: 0,
            maxX: 0,
            maxY: 0,
            width: 0,
            height: 0,
        };
    }

    const first = boxes[0];

    let x = first.x;
    let maxX = first.x + first.width;
    let y = first.y;
    let maxY = first.y + first.height;

    for (let box of boxes) {
        x = Math.min(x, box.x);
        maxX = Math.max(maxX, box.x + box.width);
        y = Math.min(y, box.y);
        maxY = Math.max(maxY, box.y + box.height);
    }

    return {
        x,
        y,
        width: maxX - x,
        height: maxY - y,
        maxX,
        maxY,
    };
}

export const selectionBrushStart = atom(null as null | IPoint);
export const selectionBrushEnd = atom(null as null | IPoint);

export const selectedNodeIDs = atom([]);
export const selectedConnectionIDs = atom([]);

export const selectionBounds = atom((get) => {
    const ids = get(selectedNodeIDs);
    if (ids.length === 0) {
        return null;
    } else {
        return getBoundingBox(ids.map((id) => get(graph.getNodeBox(id))));
    }
});

export const selectionBrush = atom((get) => {
    const start = get(selectionBrushStart);
    const end = get(selectionBrushEnd);

    if (start && end) {
        return { x0: start.x, y0: start.y, x1: end.x, y1: end.y };
    } else {
        return null;
    }
});

export const getNodeIsSelected = atomFamily((id: string) => (get) =>
    get(selectedNodeIDs).includes(id)
);

export const focusedNode = atom(null as string | null);

export const getNodeIsFocused = atomFamily((id: string) => (get) =>
    get(focusedNode) === id
);