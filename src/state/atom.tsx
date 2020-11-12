import {
	selector,
	atom as recoilAtom,
	RecoilState,
	useRecoilState,
	useSetRecoilState,
} from "recoil"

var key = 0

type Getter = <Value>(atom: RecoilState<Value>) => Value
type Setter = <Value>(atom: RecoilState<Value>, val: any) => void

export function atom<Value>(
	read: (get: Getter) => Value | Promise<Value>,
	write: (get: Getter, set: Setter, update: any) => void | Promise<void>
): RecoilState<Value>

export function atom<Value>(
	read: Function,
	write: (get: Getter, set: Setter, update: any) => void | Promise<void>
): RecoilState<Value>

export function atom<Value>(
	read: Value,
	write: (get: Getter, set: Setter, update: any) => void | Promise<void>
): RecoilState<Value>

export function atom<Value>(
	read: (get: Getter) => Value | Promise<Value>,
	write?: any
): RecoilState<Value>

export function atom<Value>(read: Function, write?: any): RecoilState<Value>

export function atom<Value>(
	initialValue: Value,
	write?: any
): RecoilState<Value>

export function atom<Value>(read: any, write: any): RecoilState<Value> {
	if (write || typeof read === "function") {
		var k = key++
		return selector({
			key: k.toString(),
			get: ({ get }) => (typeof read === "function" ? read(get) : read),
			set: write ? ({ get, set }, val) => write(get, set, val) : undefined,
		})
	} else {
		var k = key++
		return recoilAtom({
			key: k.toString(),
			default: read,
		})
	}
}

export function atomFamily<Value>(
	read: (id: string) => (get: Getter) => Value | Promise<Value>,
	write?: (
		id: string
	) => (get: Getter, set: Setter, update: any) => void | Promise<void>
): (param: string) => RecoilState<Value>

export function atomFamily<Value>(
	read: (id: string) => Function,
	write?: (
		id: string
	) => (get: Getter, set: Setter, update: any) => void | Promise<void>
): (param: string) => RecoilState<Value>

export function atomFamily<Value>(
	read: (id: string) => Value,
	write?: (
		id: string
	) => (get: Getter, set: Setter, update: any) => void | Promise<void>
): (param: string) => RecoilState<Value>

export function atomFamily<Value>(
	read: (id: string) => Value,
	write?: (
		id: string
	) => (get: Getter, set: Setter, update: any) => void | Promise<void>
): (param: string) => RecoilState<Value> {
	const cache = {}
	return (id: string) => {
		if (cache[id]) {
			return cache[id]
		} else {
			const lread = read(id)
			const lwrite = write ? write(id) : undefined

			cache[id] = atom(lread, lwrite)
			return cache[id]
		}
	}
}

export function useAtom<Value>(atom: RecoilState<Value>) {
	return useRecoilState(atom)
}

export function useUpdateAtom<Value>(atom: RecoilState<Value>) {
	return useSetRecoilState(atom)
}
