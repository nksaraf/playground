import React from "react";
import { useMonacoEditor } from "use-monaco";
import Highlight, { defaultProps } from "prism-react-renderer";
import { useEditable } from "use-editable";
import { createComponent } from "../api";
import { ComputeNode } from "../components/nodes/DataNode";

export const Monaco = createComponent(
  {
    id: "monaco",
    outputs: {
      value: {
        config: {
          type: "string",
        },
      },
    },
  },
  function Monaco({ node }) {
    const [code, setCode] = node.useState("value", "a");

    node.useCompute(() => {
      return { value: code };
    }, [code]);

    const { containerRef } = useMonacoEditor({
      path: "model.graphql",
      theme: "vs-light",
      onChange: (e) => {
        setCode(e);
      },
      defaultValue: ["a"].join("\n"),
    });

    return (
      <ComputeNode>
        <div ref={containerRef} style={{ height: 300, width: 300 }} />
      </ComputeNode>
    );
  }
);

export const Edit = createComponent(
  {
    id: "editor",
    outputs: {
      value: {
        config: {
          type: "string",
        },
      },
    },
  },
  ({ node }) => {
    const [code, setCode] = node.useState("code", "");

    node.useCompute(() => {
      return { value: code };
    }, [code]);

    const editorRef = React.useRef(null);

    useEditable(editorRef, setCode, {
      disabled: false,
      indentation: 2,
    });

    return (
      <ComputeNode>
        <Highlight {...defaultProps} code={code} language="jsx">
          {({ className, style, tokens, getTokenProps }) => (
            <pre
              className={className}
              style={{ ...style, width: 200, height: 200 }}
              ref={editorRef}
            >
              {tokens.map((line, i) => (
                <React.Fragment key={i}>
                  {line
                    .filter((token) => !token.empty)
                    .map((token, key) => (
                      <span {...getTokenProps({ token, key })} />
                    ))}
                  {i < tokens.length - 1 ? "\n" : null}
                </React.Fragment>
              ))}
            </pre>
          )}
        </Highlight>
      </ComputeNode>
    );
  }
);
