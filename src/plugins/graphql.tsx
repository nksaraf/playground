// @ts-nocheck
// TODO: 1. Add default fields recursively
// TODO: 2. Add default fields for all selections (not just fragments)
// TODO: 3. Add stylesheet and remove inline styles
// TODO: 4. Indication of when query in explorer diverges from query in editor pane
// TODO: 5. Separate section for deprecated args, with support for 'beta' fields
// TODO: 6. Custom default arg fields

// Note: Attempted 1. and 2., but they were more annoying than helpful

// class ExplorerWrapper extends React.PureComponent<Props, {}> {
//   static defaultValue = defaultValue;
//   static defaultProps = {
//     width: 320,
//     title: 'Explorer',
//   };

//   render() {
//     return (

//     );
//   }
// }
import React from "react";
import { ExplorerWrapper } from "../graphql/ExplorerWrapper";
import { getIntrospectionQuery, buildSchema } from "graphql";

const schema = buildSchema(`
  type Query {
    getIdByName(id: String): String
  }
`);

console.log(schema);

import { ComputeNode } from "../components/nodes/DataNode";
export const Edit = ({ node, tavern }) => {
  const [query, setQuery] = node.useState("query", "");
  node.useCompute(() => {
    return { value: query };
    // console.log(fetch('http://getIntrospectionQuery());
  }, [query]);

  return (
    <ComputeNode>
      <div className="overflow-hidden" style={{ height: 200, width: 200 }}>
        <ExplorerWrapper
          schema={schema}
          width={200}
          query={query}
          explorerIsOpen={true}
          onEdit={setQuery}
        />
      </div>
    </ComputeNode>
  );
};

Edit.config = {
  id: "graphql",
  outputs: {
    value: {
      config: {
        type: "string",
      },
    },
  },
};
