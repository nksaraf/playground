import { atom, atomFamily } from "../state/atom";
import * as compute from "../state/compute";
import * as graph from "../state/graph";
import * as model from "../state/model";
import * as scene from "../state/scene";
import * as selector from "../state/selector";

export const getNodeSnapshot = atomFamily(
    (id: string) => (get) => ({
        metadata: get(model.getNodeMetadata(id)),
        size: get(graph.getNodeSize(id)),
        state: get(compute.getNodeState(id)),
        position: get(graph.getNodePosition(id)),
        id,
        pins: get(model.getNodePinIDs(id)).map((inp) => ({
            metadata: get(model.getPinMetadata(inp)),
            offset: get(graph.getPinOffset(inp)),
            value: get(compute.getPinValue(inp)),
            id: inp,
        })),
    }),
    (id: string) => (get, set, node) => {
        set(model.getNodeMetadata(node.id), node.metadata);
        set(graph.getNodeSize(node.id), node.size);
        set(graph.getNodePosition(node.id), node.position);
        set(
            model.getNodePinIDs(node.id),
            node.pins.map((port) => port.id)
        );
        set(compute.getNodeState(id), node.state);
        node.pins.forEach((port) => {
            set(model.getPinMetadata(port.id), port.metadata);
            set(graph.getPinOffset(port.id), port.offset);
        });
    }
);

export const nodes = atom(
    (get) => get(model.nodeIDs).map((id) => get(getNodeSnapshot(id))),
    (get, set, update) => {
        set(
            model.nodeIDs,
            update.map((node) => node.id)
        );
        update.forEach((node) => {
            set(getNodeSnapshot(node.id), node);
        });
    }
);

export const getConnectionSnapshot = atomFamily(
    (id: string) => (get) => ({
        params: get(model.getConnectionParams(id)),
        metadata: get(model.getConnectionMetadata(id)),
        id,
    }),
    (id: string) => (get, set, conn) => {
        set(model.getConnectionParams(conn.id), conn.params);
        set(model.getConnectionMetadata(conn.id), conn.metadata);
    }
);

export const connections = atom(
    (get) => get(model.connectionIDs).map((id) => get(getConnectionSnapshot(id))),
    (get, set, update) => {
        set(
            model.connectionIDs,
            update.map((conn) => conn.id)
        );

        update.forEach((conn) => {
            set(getConnectionSnapshot(conn.id), conn);
        });
    }
);

export const graphSnapshot = atom(
    (get) => ({
        nodes: get(nodes),
        connections: get(connections),
    }),
    (get, set, update) => {
        set(nodes, update["nodes"]);
        set(connections, update["connections"]);
    }
);

export const sceneSnapshot = atom(
    (get) => ({
        camera: get(scene.camera),
        viewBox: get(scene.viewBox),
    }),
    (get, set, update) => {
        set(scene.camera, update.camera);
        set(scene.viewBox, update.viewBox);
    }
);

export const selectionSnapshot = atom(
    (get) => ({
        nodeIDs: get(selector.selectedNodeIDs),
        connectionIDs: get(selector.selectedConnectionIDs),
    }),
    (get, set, update) => {
        set(selector.selectedNodeIDs, update.nodeIDs);
        set(selector.selectedConnectionIDs, update.connectionIDs);
    }
);

