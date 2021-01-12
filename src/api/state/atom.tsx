import {
    selector,
    atom as recoilAtom,
    useRecoilState,
    useSetRecoilState,
    AtomEffect,
    RecoilState,
} from "recoil";

import type {
    PrimitiveAtom,
    Getter,
    WritableAtom,
    Atom,
    WithInitialValue,
} from "jotai/core/types";
import { RecoilRoot } from "recoil";

// import { Getter, Setter, PrimitiveAtom } from 'jotai/core/types';
// import { atom, useAtom } from 'jotai';
// export { useAtom } from 'jotai';
let key = 0;

export type { Atom, WritableAtom } from "jotai";

export type Setter = <Value, Update = Value>(
    atom: WritableAtom<Value, Update>,
    update?: Update | ((old: Value) => Update)
) => void;

export function atom<Value, Update = Value>(
    read: (get: Getter) => Value | Promise<Value>,
    write: (get: Getter, set: Setter, update: Update) => void | Promise<void>
): WritableAtom<Value, Update>;
export function atom<Value, Update = Value>(
    read: Function,
    write: (get: Getter, set: Setter, update: Update) => void | Promise<void>
): never;
export function atom<Value, Update = Value>(
    read: Value,
    write: (get: Getter, set: Setter, update: Update) => void | Promise<void>
): WritableAtom<Value, Update> & WithInitialValue<Value>;
export function atom<Value, Update extends never = never>(
    read: (get: Getter) => Value | Promise<Value>
): Atom<Value>;
export function atom<Value, Update = Value>(read: Function): never;
export function atom<Value, Update extends never = never>(
    initialValue: Value
): PrimitiveAtom<Value> & WithInitialValue<Value>;
export function atom<Value, Update = Value>(
    read: any,
    write?: any,
    effects?: ReadonlyArray<AtomEffect<Value>>
): Atom<Value> {
    if (write || typeof read === "function") {
        var k = key++;
        return selector({
            key: k.toString(),
            get: ({ get }) => (typeof read === "function" ? read(get) : read),
            set: write ? ({ get, set }, val) => write(get, set, val) : undefined,
        }) as any;
    } else {
        var k = key++;
        return recoilAtom({
            key: k.toString(),
            effects_UNSTABLE: effects ?? [],
            default: read,
        }) as any;
    }
}

export function atomFamily<Value, Param = string, Update = Value>(
    read: (id: Param) => (get: Getter) => Value | Promise<Value>,
    write?: (
        id: any
    ) => (get: Getter, set: Setter, update: Update) => void | Promise<void>
): (param: Param) => WritableAtom<Value, Update>;

export function atomFamily<Value, Param = string, Update = Value>(
    read: (id: Param) => Function,
    write?: (
        id: Param
    ) => (get: Getter, set: Setter, update: Update) => void | Promise<void>
): (param: Param) => WritableAtom<Value, Update>;

export function atomFamily<Value, Param = string, Update = Value>(
    read: (id: Param) => Value,
    write?: (
        id: Param
    ) => (get: Getter, set: Setter, update: Update) => void | Promise<void>
): (param: Param) => WritableAtom<Value, Update>;

export function atomFamily<Value, Param = string, Update = Value>(
    read: (id: Param) => Value,
    write?: (
        id: Param
    ) => (get: Getter, set: Setter, update: Update) => void | Promise<void>
): (param: Param) => WritableAtom<Value, Update> {
    const cache = {};
    return (id: any) => {
        if (cache[id]) {
            return cache[id];
        } else {
            const lread = read(id);
            const lwrite = write ? write(id) : undefined;

            cache[id] = atom(lread, lwrite);
            return cache[id];
        }
    };
}

export function Provider({ initialValues, children }) {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                initialValues.forEach(([atom, value]) => {
                    snapshot.set(atom, value);
                });
            }}
        >
            {children}
        </RecoilRoot>
    );
}

export function useAtom<Value>(atom: Atom<Value>) {
    return useRecoilState((atom as unknown) as RecoilState<Value>);
}

export function useUpdateAtom<Value>(atom: Atom<Value>) {
    return useSetRecoilState((atom as unknown) as RecoilState<Value>);
}

export type ValueOf<T> = T extends PrimitiveAtom<infer U> ? U : null;
