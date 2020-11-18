import React, { Component, Fragment } from "react";

import ObjectWrapper from "./ObjectWrapper";
import ObjectValue from "./ObjectValue";

function JsonOutput({ value, property, depth = 1, defaultOpenDepth = 3 }) {
  const [isOpened, setIsOpened] = React.useState(
    depth < defaultOpenDepth ? true : false
  );

  function renderChildren(value) {
    const data = [];
    const properties = Object.keys(value);

    for (const property of properties) {
      if (isOpened) {
        data.push(
          <JsonOutput
            defaultOpenDepth={defaultOpenDepth}
            depth={depth + 1}
            key={property}
            property={property}
            value={value[property]}
          />
        );
      }
    }

    return data;
  }

  if (typeof value === "undefined") {
    return <Fragment />;
  }

  return (
    <ul>
      <li>
        <ObjectWrapper
          isOpened={isOpened}
          value={value}
          onToggle={() => setIsOpened((e) => !e)}
        >
          {property ? `${property}: ` : ""}
          {value instanceof Array || value instanceof Object ? (
            renderChildren(value)
          ) : (
            <ObjectValue value={value} />
          )}
        </ObjectWrapper>
      </li>
    </ul>
  );
}

export default JsonOutput;
