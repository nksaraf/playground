import React from "react";
import { useAtom } from "../api";

export const useSaveToStorage = (key, atomToSave) => {
    const [atom] = useAtom(atomToSave);

    React.useEffect(() => {
        localStorage.setItem(
            key,
            JSON.stringify(atom)
        );
    }, [atom])

};
