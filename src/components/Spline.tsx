import React, { useState } from "react"

export function Spline({ end, start, ...props }) {
	const bezierCurve = (a, b, cp1x, cp1y, cp2x, cp2y, x, y) => {
		return `M ${a} ${b} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`
	}

	const distance = (a, b) => {
		return Math.sqrt(
			(b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])
		)
	}

	let dist = distance([start.x, start.y], [end.x, end.y])
	let pathString = bezierCurve(
		start.x,
		start.y,
		start.x + dist * 0.25,
		start.y,
		end.x - dist * 0.75,
		end.y,
		end.x,
		end.y
	)

	return <path d={pathString} {...props} />
}
