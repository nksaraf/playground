import React, { Component, Fragment } from "react"

function ToggleButton({ onToggle, value, isOpened }) {
	if (!value || typeof value !== "object") {
		return <Fragment />
	}

	const { length } = Object.keys(value)

	return (
		<Fragment>
			{length ? (
				<button className="absolute -ml-4" onClick={onToggle}>
					{isOpened ? (
						<Fragment>&#9662;</Fragment>
					) : (
						<Fragment>&#9656;</Fragment>
					)}
				</button>
			) : (
				""
			)}
		</Fragment>
	)
}

export default ToggleButton
