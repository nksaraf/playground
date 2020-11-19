import { sum } from "lodash";
import React from "react";
import { createComponent } from "../api";
import { ComputeNode } from "../components/nodes/DataNode";

export const NumberValue = createComponent(
  {
    id: "number",
    title: "Number",
    outputs: {
      value: {
        config: {
          type: "number",
        },
      },
    },
  },
  function NumberValue({ node, tavern }) {
    const [value, setValue] = node.useState("value", 0);

    node.useCompute(() => ({ value }), [value]);

    return (
      <ComputeNode>
        <input
          value={value}
          className="pr-1"
          style={{ width: 72 }}
          type="number"
          onChange={(e) => setValue(Number(e.currentTarget.value))}
        />
      </ComputeNode>
    );
  }
);

export const SumNumbers = createComponent(
  {
    id: "math.sum",
    title: "+ Sum",
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
      sum: {
        config: {
          type: "number",
        },
      },
    },
  },
  function SumNumbers({ node }) {
    node.useCompute((inputs) => {
      return {
        sum: sum(Object.values(inputs).map((i) => (i === null ? 0 : i))),
      };
    });
    return (
      <ComputeNode>
        <div className="w-5" />
      </ComputeNode>
    );
  }
);

export const ProductNumbers = createComponent(
  {
    id: "math.product",
    title: "Product",
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
      product: {
        config: {
          type: "number",
        },
      },
    },
  },
  function ProductNumbers({ node }) {
    node.useCompute(({ a, b }) => {
      return {
        product: (a ?? 0) * (b ?? 0),
      };
    });
    return (
      <ComputeNode>
        <div className="w-12" />
      </ComputeNode>
    );
  }
);
