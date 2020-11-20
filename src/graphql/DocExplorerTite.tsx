import * as React from "react";

function DocExplorerTite({ title, onToggleExplorer }) {
  return (
    <div className="doc-explorer-title-bar">
      <div className="doc-explorer-title">{title}</div>
      <div className="doc-explorer-rhs">
        <div className="docExplorerHide" onClick={onToggleExplorer}>
          {"\u2715"}
        </div>
      </div>
    </div>
  );
}
