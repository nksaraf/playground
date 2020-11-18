import React from "react";
import {
  ComputeNode,
  Focusable,
  useNodeContainerProps,
} from "../components/nodes/DataNode";
import { useAtom } from "../lib/atom";
import { Props, useCompute, useNodeState } from "../sdk";

export function ConcatString() {
  useCompute(({ a, b }) => {
    return { concat: a + b };
  });

  return <ComputeNode />;
}

ConcatString.config = {
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
};

import { useEditable } from "use-editable";

export function Label({ node, tavern }: Props) {
  const [value, setValue] = useNodeState("value", "Hello World");

  const props: any = useNodeContainerProps({});
  const [isSelected] = tavern.useAtom(node.isSelected);
  const [isFocused] = tavern.useAtom(node.isFocused);

  const ref = React.useRef();
  useEditable(ref, setValue);
  return (
    <div
      className={`py-4 px-6 rounded-lg border-2 cursor-move  ${
        isSelected ? "border-blue-500" : "border-transparent"
      }`}
      {...props}
    >
      <Focusable>
        <input
          className="text-lg cursor-text bg-transparent"
          style={{ whiteSpace: "pre-wrap" }}
          ref={ref}
        >
          {/* {value} */}
        </input>
      </Focusable>
    </div>
  );
}

Label.config = {
  id: "label",
  // title: "+ Concat",
  // inputs: {
  //   a: {
  //     config: {
  //       type: "number",
  //     },
  //   },
  //   b: {
  //     config: {
  //       type: "number",
  //     },
  //   },
  // },
  // outputs: {
  //   concat: {
  //     config: {
  //       type: "number",
  //     },
  //   },
  // },
};
