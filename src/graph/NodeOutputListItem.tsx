import React from "react";
import { useRecoilState } from "recoil";
import { outputStateByID } from "./store";

export const NodeOutputListItem = ({ onMouseDown, index, outputID }) => {
  const handleOnMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    onMouseDown(index);
  };

  const [outputState] = useRecoilState(outputStateByID(outputID));

  const noop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <li onMouseDown={handleOnMouseDown}>
      <a href={"#"} onClick={noop}>
        {outputState.name}
        <i className={"fa fa-circle-o"}></i>
      </a>
    </li>
  );
};
