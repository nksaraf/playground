import * as React from "react";

import useKeyboardEvents from "../hooks/useKeyboardEvents";
import useWindowEvents from "../hooks/useWindowEvents";
import useViewBox from "../hooks/useViewBox";

import { Toolbar } from "./toolbar/toolbar";
import { Canvas } from "./canvas/Canvas";
import { TavernRoot } from "../lib/storage";
import { Overlays } from "./overlays/Overlays";
import { MutableSnapshot } from "recoil";
import { library, model, useAtom, machine } from "../api";
import { registeredPlugins } from "../lib/plugins";

export default function App() {
    return (
        <TavernRoot
            initializeState={[...Object.values(registeredPlugins).map((k: any) => {
                return [library.getComponentMetadata(k.id), k];
            }),
            [library.componentIDs, Object.keys(registeredPlugins)]]}

        >
            <FullScreenContainer>
                <Canvas />
                <Toolbar />
                <Overlays />
            </FullScreenContainer>
        </TavernRoot >
    );
}

function FullScreenContainer({
    children,
    className = "",
    style = {},
    ...props
}) {
    const { ref } = useViewBox();
    useWindowEvents();
    useKeyboardEvents();

    return (
        <div
            ref={ref}
            className={`w-screen h-screen relative bg-gray-200 ${className}`}
            style={{ fontFamily: "Nunito, sans-serif", ...style }}
            {...props}
        >
            {children}
        </div>
    );
}
