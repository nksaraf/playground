import * as React from "react";
import { useAtom } from "../atom";
import { scene } from "../state/scene";


export function Camera({ children }) {
	const [{ x, y, zoom }] = useAtom(scene.camera);

	return (
		<g
			transform={`scale(${zoom}) translate(${-x / zoom} ${-y / zoom})`}
			strokeWidth={1 / zoom}
		>
			{children}
		</g>
	);
}
