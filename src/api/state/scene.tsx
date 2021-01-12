import { atom, ValueOf } from "./atom";
import { IPoint } from "./types";

export const cameraPosition = atom({
    x: 0,
    y: 0,
});

export const cameraZoom = atom(1);

export const camera = atom(
    (get) => ({
        ...get(cameraPosition),
        zoom: get(cameraZoom),
    }),
    (get, set, { x, y, zoom }) => {
        set(cameraPosition, { x, y });
        set(cameraZoom, zoom);
    }
);

export const viewBoxPosition = atom({
    x: 0,
    y: 0,
});

export const viewBoxSize = atom({
    width: 0,
    height: 0,
});

export const viewBoxScroll = atom({
    scrollX: 0,
    scrollY: 0,
});

export const screenPointerPosition = atom({ x: 0, y: 0 });

export const screenPointerDelta = atom({ dx: 0, dy: 0 });

export const screenPointer = atom((get) => ({
    ...get(screenPointerPosition),
    ...get(screenPointerDelta),
}));

export const documentPointer = atom((get) => {
    return {
        x:
            (get(cameraPosition).x +
                get(screenPointerPosition).x -
                get(viewBoxPosition).x) /
            get(cameraZoom),
        y:
            (get(cameraPosition).y +
                get(screenPointerPosition).y -
                get(viewBoxPosition).y) /
            get(cameraZoom),
    };
});

export const documentViewBoxPosition = atom((get) => {
    const { zoom, x, y } = get(camera);
    return {
        x: x / zoom,
        y: y / zoom,
    };
});

export const documentViewBoxSize = atom((get) => {
    const zoom = get(cameraZoom);
    const { width, height } = get(viewBoxSize);

    return {
        width: width / zoom,
        height: height / zoom,
    };
});

export const documentViewBox = atom((get) => {
    return {
        ...get(documentViewBoxSize),
        ...get(documentViewBoxPosition),
    };
});

export const viewBox = atom(
    (get) => ({
        position: get(viewBoxPosition),
        scroll: get(viewBoxScroll),
        size: get(viewBoxSize),
    }),
    (get, set, update) => {
        set(viewBoxPosition, update.position);
        set(viewBoxScroll, update.scroll);
        set(viewBoxSize, update.size);
    }
);

export const lastPointState = atom(
    null as {
        screenPointer: IPoint;
        documentPointer: IPoint;
        camera: ValueOf<typeof camera>;
        viewBox: ValueOf<typeof viewBox>;
    } | null
);

