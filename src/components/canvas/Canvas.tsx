import * as React from "react";
import { model, useMachine } from "../../api";
import { SvgCanvas } from "./SvgCanvas";
import { SelectionBrush } from "./SelectionBrush";
import { useAtom } from "../../api";
import { Connection } from "./Connection";
import { scene, selector } from "../../api";
import { Node } from "../../api";
import { InsertingConnectortGhost } from "./InsertingConnectortGhost";
import { InsertingNodeGhost } from "./InsertingNodeGhost";

function ViewBox({
  children,
  width,
  height,
  onMouseDown = (e) => {},
  onMouseUp = (e) => {},
}) {
  const handleWheel = useWheel();
  const machine = useMachine();
  return (
    <div
      className="relative bg-grid overflow-x-hidden overflow-y-hidden"
      style={{
        height,
        width,
        // @ts-ignore
        "--grid-color": "#e9ecf1",
        "--grid-size": "40px",
        userSelect: "none",
      }}
      onMouseDown={(e) => {
        machine.send("POINTER_DOWN_ON_CANVAS", {
          x: e.clientX,
          y: e.clientY,
        });
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        machine.send("POINTER_UP", { x: e.clientX, y: e.clientY });
        onMouseUp?.(e);
      }}
      onWheel={handleWheel}
    >
      {children}
    </div>
  );
}

export function Canvas() {
  const [{ width, height }] = useAtom(scene.viewBoxSize);

  return (
    <ViewBox width={width} height={height}>
      <SvgCanvas height={height} width={width}>
        <SelectionBrush />
        <InsertingNodeGhost />
        <InsertingConnectortGhost />
        <Connections />
      </SvgCanvas>
      <CanvasBackground height={height} width={width}>
        <Nodes />
      </CanvasBackground>
    </ViewBox>
  );
}

export function CanvasBackground({ children, height, width }) {
  const [{ x, y, zoom }] = useAtom(scene.camera);
  return (
    <div
      className="absolute camera"
      style={{
        // @ts-ignore
        "--x": `${x}px`,
        "--y": `${y}px`,
        "--zoom": zoom,
        height,
        width,
      }}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

export function useWheel() {
  const state = useMachine();
  return React.useCallback(
    (e: React.WheelEvent) => {
      const { deltaX, deltaY } = e;

      if (e.ctrlKey) {
        // Zooming
        state.send("ZOOMED", deltaY / 100);
        state.send("POINTER_MOVE");
      } else {
        // Panning
        state.send("PANNED", {
          x: deltaX,
          y: deltaY,
        });
        state.send("POINTER_MOVE");
      }
    },
    [state.send]
  );
}

export const Connections = React.memo(() => {
  const [allConnectionIDs] = useAtom(model.connectionIDs);

  return (
    <>
      {allConnectionIDs.map((id) => {
        return <Connection connectionID={id} key={id} />;
      })}
    </>
  );
});

export const Nodes = React.memo(() => {
  const [nodeIDs] = useAtom(model.nodeIDs);

  return (
    <>
      {nodeIDs.map((id) => {
        return <Node nodeID={id} key={id} />;
      })}
    </>
  );
});
