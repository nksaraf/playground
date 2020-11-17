import React, { Component, Fragment } from "react"

import ToggleButton from "./ToggleButton"

function ObjectWrapper({ onToggle, value, isOpened, children }) {
	function showType(value) {
		if (value instanceof Array) {
			return `Array(${value.length})`
		} else if (value instanceof Object) {
			return `Object(${Object.keys(value).length})`
		}
	}

	function wrapElementTree() {
		const tree = [...children]

		if (!isOpened) {
			tree.splice(1, 0, showType(value))
			return tree
		}

		if (value instanceof Array) {
			tree.splice(1, 0, "[")
			tree.push("]")
		} else if (value instanceof Object) {
			tree.splice(1, 0, "{")
			tree.push("}")
		}

		return tree
	}

	const wrappedElementTree = wrapElementTree()

	return (
		<Fragment>
			<ToggleButton isOpened={isOpened} value={value} onToggle={onToggle} />
			{wrappedElementTree}
		</Fragment>
	)
}

export default ObjectWrapper
