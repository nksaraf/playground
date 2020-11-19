import * as React from "react";
import { compute, machine, model, selector, useMachine } from "../../api";
import {
  atom,
  atomFamily,
  useAtom,
  useAtom as _useAtom,
  useUpdateAtom,
} from "../../api/state/atom";
import { graph } from "../../api";
import useResizeObserver from "use-resize-observer";
import { styled } from "../../lib/theme";
import { useNode } from "../../api";
import { useRecoilCallback } from "recoil";

export const NodeBody = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export function Focusable({ children, ...props }) {
  const focus = useRecoilCallback(({ snapshot, set }) => (id) => {
    set(selector.focusedNode, id);
    set(selector.selectedNodeIDs, [id]);
  });
  const node = useNode();

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        focus(node.id);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function ComputeNode({ children = <div className="w-4" /> }) {
  return (
    <NodeContainer>
      <NodeHeader />
      <NodeBody>
        <NodeInputs />
        <Focusable className="mx-3">{children}</Focusable>
        <NodeOutputs />
      </NodeBody>
    </NodeContainer>
  );
}

export const useNodeContainerProps = ({
  onMouseDown = (e) => {},
  style = {},
  onResize = (s) => {},
}) => {
  const node = useNode();
  const [position, setNodePosition] = useAtom(node.position);
  const [nodeSize, setNodeSize] = useAtom(node.size);
  const setResseter = useUpdateAtom(resetter);
  const { ref } = useResizeObserver({
    onResize: (s) => {
      setNodeSize(s);
      onResize?.(s);
      setResseter((r) => r + 1);
    },
  });

  const [isSelected, setIsSelected] = useAtom(node.isSelected);
  const machine = useMachine();

  return {
    onMouseDown: (e) => {
      e.stopPropagation();
      onMouseDown?.(e);
      machine.send("POINTER_DOWN_ON_NODE", { id: node.id });
    },
    style: {
      transform: `translateX(${position.x}px) translateY(${position.y}px)`,
      position: "absolute",
      ...style,
    },
    ref,
  };
};

export function NodeContainer({
  children,
  onMouseDown = () => {},
  className = "",
  style = {},
  ...props
}) {
  const node = useNode();
  const [isSelected, setIsSelected] = useAtom(node.isSelected);
  const containerProps: any = useNodeContainerProps({});

  return (
    <section
      className={`absolute bg-white border-2 ${
        isSelected ? "border-blue-500" : "border-gray-100"
      } rounded-lg shadow-xl pb-3 ${className}`}
      {...containerProps}
      {...props}
    >
      {children}
    </section>
  );
}

export function NodeHeader({ className = "", ...props }) {
  const node = useNode();
  const [meta] = useAtom(model.getNodeMetadata(node.id));

  return (
    <header
      className={`py-3 px-4 flex flex-col items-center ${className}`}
      {...props}
    >
      {meta.category && (
        <div className={"text-xs text-gray-500 font-normal uppercase"}>
          {meta.category}
        </div>
      )}
      {meta.title && (
        <div className={`text-lg text-gray-600 font-semibold`}>
          {meta.title}
        </div>
      )}
    </header>
  );
}

export function NodeInputs() {
  const node = useNode();
  const [inputs] = useAtom(node.inputIDs);

  return (
    <div className="flex flex-col gap-2">
      {inputs.length ? (
        inputs.map((id) => <NodeInput inputID={id} key={id} />)
      ) : (
        <div></div>
      )}
    </div>
  );
}

export function NodeOutputs() {
  const node = useNode();
  const [outputs] = useAtom(node.outputIDs);
  return (
    <div className="flex flex-col gap-2 items-end">
      {outputs.map((id) => (
        <NodeOutput outputID={id} key={id} />
      ))}
    </div>
  );
}

export const getPinHasConnections = atomFamily((id: string) => (get) => {
  return get(model.getPinConnectionIDs(id)).length > 0;
});

export const getPinIsAcceptingConnections = atomFamily(
  (id: string) => (get) => {
    const fromPin = get(machine.insertTool.addingConnectorFromPinID);
    if (fromPin === null) {
      return true;
    } else {
      if (fromPin === id) {
        return false;
      } else if (
        get(model.getPinMetadata(fromPin)).parentNode ===
          get(model.getPinMetadata(id)).parentNode ||
        get(model.getPinMetadata(fromPin)).type ===
          get(model.getPinMetadata(id)).type
      ) {
        return false;
      }
      return true;
    }
  }
);

export const getPinIsAddingNewConnection = atomFamily((id: string) => (get) => {
  return get(machine.insertTool.addingConnectorFromPinID) === id;
});

export function NodeInput({ inputID }) {
  const [input] = useAtom(model.getPinMetadata(inputID));
  const ref = usePinRef(inputID);
  const [hasConnections] = useAtom(getPinHasConnections(inputID));
  const [isAcceptingConnection] = useAtom(
    getPinIsAcceptingConnections(inputID)
  );
  const [val] = useAtom(compute.getPinValue(inputID));
  const machine = useMachine();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingNewConnection] = useAtom(getPinIsAddingNewConnection(inputID));

  const isActive =
    hasConnections ||
    (isAcceptingConnection && isHovered) ||
    isAddingNewConnection;

  return (
    <div>
      <div
        className="flex items-center gap-1"
        onMouseEnter={(e) => {
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          machine.send("POINTER_UP_ON_PIN", { pinID: inputID });
        }}
      >
        <div
          ref={ref}
          onMouseDown={(e) => {
            e.stopPropagation();
            machine.send("POINTER_DOWN_ON_PIN", { pinID: inputID });
          }}
        >
          <Pin
            isActive={isActive}
            style={{
              transform: `translateX(-6px) scale(${isHovered ? 1.2 : 1.0})`,
            }}
            className={`h-3 w-3 ${
              !isAcceptingConnection ? "cursor-not-allowed" : "cursor-pointer"
            } ${isActive ? "text-blue-500" : "text-gray-500"}`}
          />
        </div>
        <div className="text-gray-700 text-xs">
          {input.name} <span className="text-gray-500 text-xs">{val}</span>
        </div>
      </div>
    </div>
  );
}

function Pin({ isActive, ...props }) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle
        cx={12}
        cy={12}
        r={9}
        strokeWidth={3}
        fill="transparent"
        className="stroke-current"
      />
      {isActive && <circle cx={12} cy={12} r={6} className="fill-current" />}
    </svg>
  );
}

export function NodeOutput({ outputID }) {
  const [output] = useAtom(model.getPinMetadata(outputID));
  const [connIDs] = useAtom(model.getPinConnectionIDs(outputID));
  const machine = useMachine();
  const ref = usePinRef(outputID);
  const [value] = useAtom(compute.getPinValue(outputID));

  const [hasConnections] = useAtom(getPinHasConnections(outputID));
  const [isAddingNewConnection] = useAtom(
    getPinIsAddingNewConnection(outputID)
  );
  const [isAcceptingConnection] = useAtom(
    getPinIsAcceptingConnections(outputID)
  );
  const [isHovered, setIsHovered] = React.useState(false);

  const isActive =
    hasConnections ||
    (isAcceptingConnection && isHovered) ||
    isAddingNewConnection;

  return (
    <div>
      <div
        className="flex items-center gap-1"
        onMouseEnter={(e) => {
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          machine.send("POINTER_UP_ON_PIN", { pinID: outputID });
        }}
      >
        <div className="text-gray-500 text-xs">
          {value} {output.name}
        </div>
        <div
          ref={ref}
          onMouseDown={(e) => {
            e.stopPropagation();
            machine.send("POINTER_DOWN_ON_PIN", { pinID: outputID });
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{
              cursor: !isAcceptingConnection ? "not-allowed" : "pointer",
              transform: `translateX(6px) scale(${isHovered ? 1.1 : 1.0})`,
            }}
            className={`h-3 w-3 ${
              isActive ? "text-blue-500" : "text-gray-500"
            }`}
          >
            <circle
              cx={12}
              cy={12}
              r={9}
              strokeWidth={3}
              fill="transparent"
              className="stroke-current"
            />
            {isActive && (
              <circle cx={12} cy={12} r={6} className="fill-current" />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

const resetter = atom(0);

export function usePinRef(portID) {
  const setOffset = useUpdateAtom(graph.getPinOffset(portID));
  const ref = React.useRef<HTMLDivElement>();
  useAtom(resetter);

  React.useLayoutEffect(() => {
    setOffset({
      x: ref.current?.offsetLeft + ref.current?.offsetWidth / 2,
      y: ref.current?.offsetTop + ref.current?.offsetHeight / 2,
    });
  }, [
    ref.current?.offsetLeft,
    ref.current?.offsetTop,
    ref.current?.offsetWidth,
    ref.current?.offsetHeight,
  ]);

  return ref;
}
