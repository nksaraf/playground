export const exampleGraph = {
  nodes: [
    {
      nid: 1,
      type: "WebGLRenderer",
      x: 1479,
      y: 351,
      fields: {
        in: [
          { name: "width" },
          { name: "height" },
          { name: "scene" },
          { name: "camera" },
          { name: "bg_color" },
          { name: "postfx" },
          { name: "shadowCameraNear" },
          { name: "shadowCameraFar" },
          { name: "shadowMapWidth" },
          { name: "shadowMapHeight" },
          { name: "shadowMapEnabled" },
          { name: "shadowMapSoft" },
        ],
        out: [],
      },
    },
    {
      nid: 14,
      type: "Camera",
      x: 549,
      y: 478,
      fields: {
        in: [
          { name: "fov" },
          { name: "aspect" },
          { name: "near" },
          { name: "far" },
          { name: "position" },
          { name: "target" },
          { name: "useTarget" },
        ],
        out: [{ name: "out" }],
      },
    },
    {
      nid: 23,
      type: "Scene",
      x: 1216,
      y: 217,
      fields: {
        in: [
          { name: "children" },
          { name: "position" },
          { name: "rotation" },
          { name: "scale" },
          { name: "doubleSided" },
          { name: "visible" },
          { name: "castShadow" },
          { name: "receiveShadow" },
        ],
        out: [{ name: "out" }],
      },
    },
    {
      nid: 35,
      type: "Merge",
      x: 948,
      y: 217,
      fields: {
        in: [
          { name: "in0" },
          { name: "in1" },
          { name: "in2" },
          { name: "in3" },
          { name: "in4" },
          { name: "in5" },
        ],
        out: [{ name: "out" }],
      },
    },
    {
      nid: 45,
      type: "Color",
      x: 950,
      y: 484,
      fields: {
        in: [{ name: "rgb" }, { name: "r" }, { name: "g" }, { name: "b" }],
        out: [{ name: "rgb" }, { name: "r" }, { name: "g" }, { name: "b" }],
      },
    },
    {
      nid: 55,
      type: "Vector3",
      x: 279,
      y: 503,
      fields: {
        in: [{ name: "xyz" }, { name: "x" }, { name: "y" }, { name: "z" }],
        out: [{ name: "xyz" }, { name: "x" }, { name: "y" }, { name: "z" }],
      },
    },
    {
      nid: 65,
      type: "ThreeMesh",
      x: 707,
      y: 192,
      fields: {
        in: [
          { name: "children" },
          { name: "position" },
          { name: "rotation" },
          { name: "scale" },
          { name: "doubleSided" },
          { name: "visible" },
          { name: "castShadow" },
          { name: "receiveShadow" },
          { name: "geometry" },
          { name: "material" },
          { name: "overdraw" },
        ],
        out: [{ name: "out" }],
      },
    },
    {
      nid: 79,
      type: "Timer",
      x: 89,
      y: 82,
      fields: {
        in: [{ name: "reset" }, { name: "pause" }, { name: "max" }],
        out: [{ name: "out" }],
      },
    },
    {
      nid: 84,
      type: "MathMult",
      x: 284,
      y: 82,
      fields: {
        in: [{ name: "in" }, { name: "factor" }],
        out: [{ name: "out" }],
      },
    },
    {
      nid: 89,
      type: "Vector3",
      x: 486,
      y: 188,
      fields: {
        in: [{ name: "xyz" }, { name: "x" }, { name: "y" }, { name: "z" }],
        out: [{ name: "xyz" }, { name: "x" }, { name: "y" }, { name: "z" }],
      },
    },
  ],
  connections: [
    { from_node: 23, from: "out", to_node: 1, to: "scene" },
    { from_node: 14, from: "out", to_node: 1, to: "camera" },
    { from_node: 14, from: "out", to_node: 35, to: "in5" },
    { from_node: 35, from: "out", to_node: 23, to: "children" },
    { from_node: 45, from: "rgb", to_node: 1, to: "bg_color" },
    { from_node: 55, from: "xyz", to_node: 14, to: "position" },
    { from_node: 65, from: "out", to_node: 35, to: "in0" },
    { from_node: 79, from: "out", to_node: 84, to: "in" },
    { from_node: 89, from: "xyz", to_node: 65, to: "rotation" },
    { from_node: 84, from: "out", to_node: 89, to: "y" },
  ],
};

import { selector } from "recoil";
import {
  nodeTypeByID,
  nodePositionByID,
  inputIDsByNodeID,
  inputStateByID,
  outputIDsByNodeID,
  outputStateByID,
  nodeIDs,
  connectionParamsByID,
  connectionIDs,
} from "./store";
export const writeGraph = selector({
  key: "store",
  get: () => {
    return null;
  },
  set: ({ set, get }, val: typeof exampleGraph) => {
    val.nodes.map((node) => {
      const nodeId = `${node.nid}`;
      set(nodeTypeByID(nodeId), node.type);
      set(nodePositionByID(nodeId), { x: node.x, y: node.y });
      set(
        inputIDsByNodeID(nodeId),
        node.fields.in.map(
          (field, index) => `${nodeId}/input/${index}/${field.name}`
        )
      );
      node.fields.in.forEach((field, index) => {
        set(inputStateByID(`${nodeId}/input/${index}/${field.name}`), {
          name: field.name,
          parentNode: nodeId,
          index,
        });
      });
      set(
        outputIDsByNodeID(nodeId),
        node.fields.out.map(
          (field, index) => `${nodeId}/output/${index}/${field.name}`
        )
      );
      node.fields.out.forEach((field, index) => {
        set(outputStateByID(`${nodeId}/output/${index}/${field.name}`), {
          name: field.name,
          parentNode: nodeId,
          index,
        });
      });
    });
    set(
      nodeIDs,
      val.nodes.map((node) => `${node.nid}`)
    );
    const computePinIdxfromLabel = (pins, pinLabel) => {
      let reval = 0;
      for (let pin of pins) {
        if (pin.name === pinLabel) {
          return reval;
        } else {
          reval++;
        }
      }
    };
    const getNodeById = (nodes, nid) => {
      let reval = 0;
      for (const node of nodes) {
        if (node.nid === nid) {
          return nodes[reval];
        } else {
          reval++;
        }
      }
    };
    val.connections.map((conn) => {
      const connId = `${conn.from_node}/${conn.from}->${conn.to_node}/${conn.to}`;
      const fromNode = getNodeById(val.nodes, conn.from_node);
      const toNode = getNodeById(val.nodes, conn.to_node);

      set(connectionParamsByID(connId), {
        fromNode: conn.from_node.toString(),
        inputField: `${toNode.nid}/input/${computePinIdxfromLabel(
          toNode.fields.in,
          conn.to
        )}/${conn.to}`,
        outputField: `${fromNode.nid}/output/${computePinIdxfromLabel(
          fromNode.fields.out,
          conn.from
        )}/${conn.from}`,
        toNode: conn.to_node.toString(),
      });
    });
    set(
      connectionIDs,
      val.connections.map(
        (conn) => `${conn.from_node}/${conn.from}->${conn.to_node}/${conn.to}`
      )
    );
  },
});
