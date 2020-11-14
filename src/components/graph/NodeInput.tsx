import React from "react";

import { NodeInputListItem } from "./NodeInputListItem";

export const NodeInputList = ({ items, onCompleteConnector }) => {
  const onMouseUp = (i) => {
    onCompleteConnector(i);
  };

  return (
    <div className={"nodeInputWrapper"}>
      <ul className={"nodeInputList"}>
        {items.map((id, index) => {
          return (
            <NodeInputListItem
              onMouseUp={(i) => onMouseUp(i)}
              key={id}
              index={index}
              inputID={id}
            />
          );
        })}
      </ul>
    </div>
  );
};
