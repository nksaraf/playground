import { createContext } from "create-hook-context";
import React from "react";

import * as tavern from "./core";
import { atomFamily, useUpdateAtom } from "./state";

export type Props = { node: NodeAtoms; tavern: typeof tavern };

export let getNodeAtoms = (id: string) => ({
    position: tavern.graph.getNodePosition(id),
    inputIDs: tavern.compute.getNodeInputIDs(id),
    pinIDs: tavern.model.getNodePinIDs(id),
    outputIDs: tavern.compute.getNodeOutputIDs(id),
    size: tavern.graph.getNodeSize(id),
    box: tavern.graph.getNodeBox(id),
    isFocused: tavern.selector.getNodeIsFocused(id),
    state: tavern.compute.getNodeState(id),
    inputValues: tavern.compute.getNodeInputValues(id),
    isSelected: tavern.selector.getNodeIsSelected(id),
    connectionIDs: tavern.model.getNodeConnectionIDs(id),
    metadata: tavern.model.getNodeMetadata(id),
    id,
});

export type NodeAtoms<Inputs = any, Outputs = any> = ReturnType<
    typeof getNodeAtoms
>;

const [NodeProvider, useNode] = createContext(
    ({ node }: { node: NodeAtoms }) => {
        return {
            ...node,
            useUpdateOutputs,
            useUpdateEffect,
            useCompute,
            useState,
        };
    }
);

export { NodeProvider, useNode };

const getNodeUpdateOutputs = atomFamily((id) => null, (id) => (get, set, { name, value }) => {
    let outputIDs = get(tavern.compute.getNodeOutputIDs(id))
    let toSet = outputIDs.find(
        (id) =>
            get(tavern.model.getPinMetadata(id))
                .name === name
    );

    if (toSet) {
        set(tavern.compute.getPinValue(toSet), value);
    }
})

function useUpdateOutputs() {
    const node = useNode();
    return useUpdateAtom(getNodeUpdateOutputs(node.id))
}

function useUpdateEffect(
    fn: (update: (output: string, val: any) => void) => void,
    deps: any[] = []
) {
    const update = useUpdateOutputs();
    React.useEffect(() => {
        fn((key, val) => update({ name: key, value: val }));
    }, [update, ...deps]);
}

function useCompute(
    fn: (inputs: { [key: string]: any }) => { [key: string]: any },
    deps = []
) {
    const node = useNode();
    const update = useUpdateOutputs();
    const [inputs] = tavern.useAtom(node.inputValues);

    React.useEffect(() => {
        const result = fn(inputs);
        Object.keys(result).forEach((key) => {
            update({ name: key, value: result[key] });
        });
    }, [...Object.values(inputs), update, ...deps]);
}

function useState(key, defaultValue?: any) {
    const node = useNode();

    const [state, setState] = tavern.useAtom(node.state);
    return [
        state[key] ?? defaultValue,
        React.useCallback(
            (val) =>
                setState((oldVal) => ({
                    ...oldVal,
                    [key]: typeof val === "function" ? val(oldVal[key]) : val,
                })),
            [setState]
        ),
    ] as const;
}

export interface Node<Inputs, Outputs> extends NodeAtoms<Inputs, Outputs> {
    useUpdateEffect(
        fn: (update: (output: keyof Outputs, val: any) => void) => void,
        deps?: any[]
    ): void;

    useCompute(
        fn: (
            inputs: { [key in keyof Inputs]: any }
        ) => { [key in keyof Outputs]: any },
        deps?: any[]
    ): void;

    useState<T>(
        key: string,
        defaultValue?: T
    ): [T, React.Dispatch<React.SetStateAction<T>>];

    useUpdateOutputs(): (name: keyof Outputs, val: any) => Promise<void>;
}

export type RenderNode<Inputs, Outputs> = React.FC<{
    node: Node<Inputs, Outputs>;
    tavern: typeof tavern;
}>;

export const Node = React.memo(({ nodeID }: { nodeID: string }) => {
    const node = React.useMemo(
        () => ({
            ...getNodeAtoms(nodeID),
            useUpdateEffect,
            useUpdateOutputs,
            useState,
            useCompute,
        }),
        [nodeID]
    );
    const [metadata] = tavern.useAtom(node.metadata);
    const [component] = tavern.useAtom(
        tavern.library.getComponentMetadata(metadata.componentID)
    );
    const Component = component.render;

    return (
        <NodeProvider node={node}>
            <Component node={node} tavern={tavern} />
        </NodeProvider>
    );
});
