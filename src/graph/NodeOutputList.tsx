import React from "react";

import { NodeOutputListItem } from "./NodeOutputListItem";

export const NodeOutputList = ({ onStartConnector, items }) => {
  const onMouseDown = (i) => {
    onStartConnector(i);
  };

  return (
    <div className={"nodeOutputWrapper"}>
      <ul className={"nodeOutputList"}>
        {items.map((outputID, index) => {
          return (
            <NodeOutputListItem
              onMouseDown={(i) => onMouseDown(i)}
              key={outputID}
              index={index}
              outputID={outputID}
            />
          );
        })}
      </ul>
    </div>
  );
};
