import * as React from "react";
import { useAtom } from "./atom/atom";
import { scene } from "./state/scene";
import { Camera } from "./Camera";

export function SvgCanvas({ children, height, width }) {
	const [viewBoxSize] = useAtom(scene.viewBoxSize);
	return (
		<svg
			className="absolute"
			style={{
				height,
				width,
				userSelect: "none",
			}}
			viewBox={`${0} ${0} ${viewBoxSize.width} ${viewBoxSize.height}`}
		>
			<Camera>{children}</Camera>
		</svg>
	);
}
