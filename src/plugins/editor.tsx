import React from "react"
import { useMonacoEditor } from "use-monaco"
import { ComputeNode } from "../components/nodes/DataNode"
import { useAtom } from "../lib/atom"
import { useCompute, useNodeState } from "../sdk"

export function Monaco({ node }) {
	const [{ value = "" as string }, setVal] = useAtom(node.state)

	useCompute(() => {
		return { value }
	}, [value])

	const { containerRef } = useMonacoEditor({
		path: "model.graphql",
		theme: "vs-light",
		onChange: (e) => {
			setVal({ value: e })
		},
		defaultValue: ["a"].join("\n"),
	})

	return (
		<ComputeNode>
			<div ref={containerRef} style={{ height: 300, width: 300 }}></div>
		</ComputeNode>
	)
}

Monaco.config = {
	id: "monaco",
	outputs: {
		value: {
			config: {
				type: "string",
			},
		},
	},
}

import Highlight, { defaultProps } from "prism-react-renderer"
import { useEditable } from "use-editable"

export const Edit = ({ node }) => {
	const [code, setCode] = useNodeState("code", "")

	useCompute(() => {
		return { value: code }
	}, [code])

	const editorRef = React.useRef(null)

	useEditable(editorRef, setCode, {
		disabled: false,
		indentation: 2,
	})

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
	)
}

Edit.config = {
	id: "editor",
	outputs: {
		value: {
			config: {
				type: "string",
			},
		},
	},
}
