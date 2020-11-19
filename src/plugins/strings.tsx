import React from "react";
import {
  ComputeNode,
  Focusable,
  useNodeContainerProps,
} from "../components/nodes/DataNode";
import { createComponent } from "../api";

export const ConcatString = createComponent(
  {
    id: "string.concat",
    title: "+ Concat",
    inputs: {
      a: {
        config: {
          type: "number",
        },
      },
      b: {
        config: {
          type: "number",
        },
      },
    },
    outputs: {
      concat: {
        config: {
          type: "number",
        },
      },
    },
  },
  function ConcatString({ node }) {
    node.useCompute(({ a, b }) => {
      return { concat: a + b };
    });

    return <ComputeNode />;
  }
);

export const Label = createComponent({ id: "label" }, function Label({
  node,
  tavern,
}) {
  const [value, setValue] = node.useState("value", "Hello World");

  const props: any = useNodeContainerProps({});
  const [isSelected] = tavern.useAtom(node.isSelected);
  const [isFocused] = tavern.useAtom(node.isFocused);

  const ref = React.useRef();
  return (
    <div
      className={`py-4 px-6 rounded-lg border-2 cursor-move  ${
        isSelected ? "border-blue-500 bg-gray-50" : "border-transparent"
      }`}
      {...props}
    >
      <Focusable>
        <textarea
          className="text-lg cursor-text text-center bg-transparent"
          style={{ whiteSpace: "pre-wrap", resize: "both" }}
          onChange={(e) => setValue(e.currentTarget.value)}
          value={value}
          ref={ref}
        >
          {/* {value} */}
        </textarea>
      </Focusable>
    </div>
  );
});
