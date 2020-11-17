import * as React from "react";
import { ZoomIndicator } from "./ZoomIndicator";
import { Positions } from "./Positions";
import { SelectedNodes } from "./SelectedNodes";

export function Overlays() {
	return (
		<>
			<Positions />
			<ZoomIndicator />
			<SelectedNodes />
		</>
	);
}
