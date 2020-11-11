import React, { useState } from "react";
import { useRecoilState } from "recoil";
import { inputStateByID } from "./store";

export const NodeInputListItem = ({ onMouseUp, index, inputID }) => {
  const [hover, setHover] = useState(false);
  const [inputState] = useRecoilState(inputStateByID(inputID));

  const handleOnMouseUp = (e) => {
    e.stopPropagation();
    e.preventDefault();

    onMouseUp(index);
  };

  const onMouseOver = () => {
    setHover(true);
  };

  const onMouseOut = () => {
    setHover(false);
  };

  const noop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <li>
      <a onClick={noop} onMouseUp={handleOnMouseUp} href={"#"}>
        <i
          className={hover ? "fa fa-circle-o hover" : "fa fa-circle-o"}
          onMouseOver={onMouseOver}
          onMouseOut={onMouseOut}
        ></i>
        {inputState.name}
      </a>
    </li>
  );
};
