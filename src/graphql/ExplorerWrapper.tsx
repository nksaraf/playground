import * as React from "react";
import { Props, Explorer } from "./index";
import { ErrorBoundary } from "./ErrorBoundary";


export const ExplorerWrapper = React.memo((props: Props) => {
  const { width, explorerIsOpen, title, onToggleExplorer } = props;
  return explorerIsOpen ? (
    <div
      className="h-full z-20 overflow-hidden flex-col flex"
      style={{
        width: width,
        minWidth: width,
      }}
    >
      <ErrorBoundary>
        <Explorer {...props} />
      </ErrorBoundary>
    </div>
  ) : null;
});
