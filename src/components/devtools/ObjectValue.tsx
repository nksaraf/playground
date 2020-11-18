import React from "react";

function ObjectValue({ value }) {
  function renderValue(value) {
    let formattedValue = <span className="null">(null)</span>;

    if (typeof value === "string") {
      formattedValue = <span className="text-green-600">"{value}"</span>;
    } else if (typeof value === "number") {
      formattedValue = <span className="text-blue-600">{value}</span>;
    }

    return formattedValue;
  }

  return <>{renderValue(value)}</>;
}

export default ObjectValue;
