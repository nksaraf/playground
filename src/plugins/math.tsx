import { sum } from "lodash";
import React from "react";
import { ComputeNode } from "../components/nodes/DataNode";
import { useAtom } from "../lib/atom";
import { useCompute } from "../sdk";

export function NumberValue({ node }) {
  const [{ value = 0 as number }, setVal] = useAtom(node.state);

  useCompute(() => ({ value }), [value]);

  return (
    <ComputeNode>
      <input
        value={value}
        className="pr-1"
        style={{ width: 72 }}
        type="number"
        onChange={(e) => setVal({ value: Number(e.currentTarget.value) })}
      />
    </ComputeNode>
  );
}

NumberValue.config = {
  id: "number",
  title: "Number",
  outputs: {
    value: {
      config: {
        type: "number",
      },
    },
  },
};

export function SumNumbers() {
  useCompute((inputs) => {
    return { sum: sum(Object.values(inputs).map((i) => (i === null ? 0 : i))) };
  });
  return (
    <ComputeNode>
      <div className="w-5" />
    </ComputeNode>
  );
}

SumNumbers.config = {
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
};

export function ProductNumbers() {
  useCompute(({ a, b }) => {
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

ProductNumbers.config = {
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
};
