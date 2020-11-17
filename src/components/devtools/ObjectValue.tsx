import React, { Component, Fragment } from "react"

function ObjectValue({ value }) {
	function renderValue(value) {
		let formattedValue = <span className="null">(null)</span>

		if (typeof value === "string") {
			formattedValue = <span className="text">"{value}"</span>
		} else if (typeof value === "number") {
			formattedValue = <span className="number">{value}</span>
		}

		return formattedValue
	}

	return <Fragment>{renderValue(value)}</Fragment>
}

export default ObjectValue
