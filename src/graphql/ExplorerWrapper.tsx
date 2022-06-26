import * as React from "react";
import { Props } from "./index";
import { ErrorBoundary } from "./ErrorBoundary";
import { RecoilRoot } from "recoil";
import { GraphQLSchema } from "graphql";
import * as tavern from "../api/core";

const fieldName = tavern.atomFamily((fieldPath) => {});

function Arrow({ isOpen }) {
  return isOpen ? (
    <svg className="h-2 w-3 text-red-500">
      <path fill="currentColor" d="M 0 2 L 9 2 L 4.5 7.5 z" />
    </svg>
  ) : (
    <svg width="12px" height="9px">
      <path fill="#666" d="M 0 0 L 0 9 L 5.5 4.5 z" />
    </svg>
  );
}

function Checkbox() {
  return (
    <svg
      style={{ marginRight: "3px", marginLeft: "-3px" }}
      width="12px"
      height="12px"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM16 16H2V2H16V16ZM14.99 6L13.58 4.58L6.99 11.17L4.41 8.6L2.99 10.01L6.99 14L14.99 6Z"
        fill="#666"
      />
    </svg>
  );
}

function Explorer({
  width,
  schema,
  value,
  onChange,
}: {
  schema: GraphQLSchema;
  value: string;
  width: number;
  onChange: (e: string) => void;
}) {
  return (
    <div className="">
      {Object.values(schema.getQueryType().getFields()).map((field) => (
        <div className="flex flex-row space-x-1 items-center">
          <Arrow isOpen />
          <pre className="text-gray-700 text-xs">{field.name}</pre>
        </div>
      ))}
    </div>
  );
}

export const ExplorerWrapper = React.memo(
  (props: {
    schema: GraphQLSchema;
    value: string;
    width: number;
    onChange: (e: string) => void;
    isOpen?: boolean;
  }) => {
    const { width, isOpen = true } = props;
    return isOpen ? (
      <div
        className="h-full z-20 overflow-scroll flex-col flex flex-1"
        style={{
          width: width,
        }}
      >
        <ErrorBoundary>
          <RecoilRoot>
            <Explorer {...props} />
          </RecoilRoot>
        </ErrorBoundary>
      </div>
    ) : null;
  }
);
