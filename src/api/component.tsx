import { RenderNode } from "./node";

export interface ComponentConfig<Inputs = {}, Outputs = {}> {
  id: string;
  title?: string;
  type?: string;
  inputs?: {
    [key in keyof Inputs]: {
      config: {
        type: Inputs[key];
      };
    };
  };
  outputs?: {
    [key in keyof Outputs]: {
      config: {
        type: Outputs[key];
      };
    };
  };
  [key: string]: any;
}

export interface TavernComponent<Inputs, Outputs> {
  render: RenderNode<Inputs, Outputs>;
  type: string;
  id: string;
  metadata: any;
  pins: any[];
}

export function createComponent<Inputs, Outputs>(
  config: ComponentConfig<Inputs, Outputs>,
  render: RenderNode<Inputs, Outputs>
) {
  const {
    id,
    inputs = {},
    outputs = {},
    type = "component",
    ...metadata
  } = config;
  return {
    render,
    type,
    id,
    metadata,
    pins: [
      ...Object.keys(inputs).map((i) => ({
        ...inputs[i],
        name: i,
        role: "input",
      })),
      ...Object.keys(outputs).map((i) => ({
        ...outputs[i],
        name: i,
        role: "output",
      })),
    ],
  } as TavernComponent<Inputs, Outputs>;
}
