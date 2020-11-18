import React from "react";
import { useRecoilCallback } from "recoil";
import { useAtom } from "../lib/atom";

export const useSaveToStorage = (key, atomToSave) => {
  const saver = useRecoilCallback((cb) => async () => {
    localStorage.setItem(
      key,
      JSON.stringify(cb.snapshot.getLoadable(atomToSave).contents)
    );
  });

  React.useEffect(() => {
    saver();
  });

  useAtom(atomToSave);
};
