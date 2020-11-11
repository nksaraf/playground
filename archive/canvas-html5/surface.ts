import {
	doBoxesCollide,
	pointInRectangle,
	pointInCorner,
	getCorners,
	pointInEdge,
} from "../../components/utils"
import { S } from "@state-designer/react"
import { IBox, IPoint, IBrush, IFrame, IBounds } from "../../types"
import state, { pointerState } from "../../components/state"

const PI2 = Math.PI * 2

export enum HitType {
	Canvas = "canvas",
	Bounds = "bounds",
	BoundsCorner = "bounds-corner",
	BoundsEdge = "bounds-edge",
	Box = "box",
}

export type Hit =
	| { type: HitType.Canvas }
	| { type: HitType.Bounds }
	| { type: HitType.BoundsCorner; corner: number }
	| { type: HitType.BoundsEdge; edge: number }
	| { type: HitType.Box; id: string }

class Surface {
	_lineWidth = 2
	_stroke: string
	_fill: string
	_unsub: () => void
	_diffIndex = 0
	_looping = true
	hit: Hit = { type: HitType.Canvas }

	cvs: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
	state = state

	constructor(canvas: HTMLCanvasElement) {
		this.cvs = canvas
		this.ctx = canvas.getContext("2d")
		this.stroke = "#000"
		this.fill = "rgba(255, 255, 255, .5)"
		this.save()

		// this._unsub = this.state.onUpdate(() => {
		// 	this.clear()
		// 	this.draw()
		// })

		this.loop()
	}

	private loop = () => {
		if (!this._looping) return
		this.hit = this.hitTest()
		this.cvs.style.setProperty("cursor", this.getCursor(this.hit))

		if (state.index === this._diffIndex) {
			requestAnimationFrame(this.loop)
			return
		}

		this._diffIndex = state.index
		this.clear()
		this.draw()

		requestAnimationFrame(this.loop)
	}

	destroy() {
		// this._unsub()
		this._looping = false
	}

	draw() {
		this.setupCamera()
		this.renderBoxes()
		if (!this.state.isIn("dragging")) {
			this.renderSelection()
			this.renderBrush()
		}
	}

	setupCamera() {
		const { camera } = this.state.data

		const dpr = window.devicePixelRatio || 1

		this.ctx.translate(-camera.x * dpr, -camera.y * dpr)
		this.ctx.scale(camera.zoom * dpr, camera.zoom * dpr)
		this.lineWidth = 1 / camera.zoom
	}

	renderBoxes() {
		for (let box of Object.values(this.state.data.boxes)) {
			this.drawBox(box)
		}
	}

	renderSelection() {
		const { camera, bounds, boxes, selectedBoxIds } = this.state.data

		if (selectedBoxIds.length > 0) {
			this.save()
			this.stroke = "blue"

			// draw box outlines
			for (let id of selectedBoxIds) {
				let box = boxes[id]
				this.ctx.strokeRect(box.x, box.y, box.width, box.height)
			}

			if (bounds) {
				// draw bounds outline
				this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
				this.save()
				this.fill = "blue"
				for (let [x, y] of getCorners(
					bounds.x,
					bounds.y,
					bounds.width,
					bounds.height
				)) {
					this.drawDot({ x, y }, 3 / camera.zoom)
				}
				this.restore()
			}

			this.restore()
		}
	}

	renderBrush() {
		const { brush } = this.state.data
		if (brush) {
			this.save()
			this.stroke = "rgba(0,0,0,.2)"
			this.fill = "rgba(0,0,0,.1)"
			this.drawBrush(brush)
			this.restore()
		}
	}

	hitTest(): Hit {
		const point = pointerState.data.document
		const { camera, viewBox, boxes, bounds, selectedBoxIds } = this.state.data

		if (bounds) {
			// Test if point collides the (padded) bounds
			if (pointInRectangle(point, bounds, 16)) {
				const { x, y, width, height, maxX, maxY } = bounds
				const p = 5 / camera.zoom
				const pp = p * 2

				const cornerBoxes = [
					{ x: x - p, y: y - p, width: pp, height: pp },
					{ x: maxX - p, y: y - p, width: pp, height: pp },
					{ x: maxX - p, y: maxY - p, width: pp, height: pp },
					{ x: x - p, y: maxY - p, width: pp, height: pp },
				]

				for (let i = 0; i < cornerBoxes.length; i++) {
					if (pointInRectangle(point, cornerBoxes[i])) {
						return { type: HitType.BoundsCorner, corner: i }
					}
				}

				const edgeBoxes = [
					{ x: x + p, y: y - p, width: width - pp, height: pp },
					{ x: maxX - p, y: y + p, width: pp, height: height - pp },
					{ x: x + p, y: maxY - p, width: width - pp, height: pp },
					{ x: x - p, y: y + p, width: pp, height: height - pp },
				]

				for (let i = 0; i < edgeBoxes.length; i++) {
					if (pointInRectangle(point, edgeBoxes[i])) {
						return { type: HitType.BoundsEdge, edge: i }
					}
				}
				// Point is in the middle of the bounds
				return { type: HitType.Bounds }
			}
		}

		// Either we don't have bounds or we're out of bounds
		for (let box of Object.values(boxes)) {
			// Test if box is in viewport
			if (!doBoxesCollide(box, viewBox.document)) continue

			// Test if point collides the (padded) box
			if (pointInRectangle(point, box)) {
				// Point is in the middle of the box
				return { type: HitType.Box, id: box.id }
			}
		}

		return { type: HitType.Canvas }
	}

	clear() {
		const { cvs, ctx } = this
		ctx.resetTransform()
		ctx.clearRect(0, 0, cvs.width, cvs.height)
		this.restore()
	}

	drawBox(box: IBox | IFrame) {
		const { ctx } = this
		const { x, y, width, height } = box
		const path = new Path2D()
		path.rect(x, y, width, height)
		ctx.fill(path)
		ctx.stroke(path)
	}

	drawDot(point: IPoint, radius = 2) {
		const { ctx } = this
		const { x, y } = point
		ctx.beginPath()
		ctx.ellipse(x, y, radius, radius, 0, 0, PI2, false)
		ctx.fill()
	}

	drawEdge(start: IPoint, end: IPoint) {
		const { ctx } = this
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	drawBrush(brush: IBrush) {
		const { ctx } = this
		const { x0, y0, x1, y1 } = brush
		const path = new Path2D()
		path.rect(
			Math.min(x1, x0),
			Math.min(y1, y0),
			Math.abs(x1 - x0),
			Math.abs(y1 - y0)
		)
		ctx.fill(path)
		ctx.stroke(path)
	}

	getCursor(hit: Hit) {
		const { isIn } = this.state
		if (isIn("dragging")) {
			return "grabbing"
		}
		if (isIn("brushSelecting")) {
			return "crosshair"
		}

		switch (hit.type) {
			case "box":
			case "bounds": {
				return "grab"
			}
			case "bounds-corner": {
				return hit.corner % 2 === 0 ? "nwse-resize" : "nesw-resize"
			}
			case "bounds-edge": {
				return hit.edge % 2 === 0 ? "ns-resize" : "ew-resize"
			}
			case "canvas": {
				return "default"
			}
		}
	}

	save() {
		this.ctx.save()
	}

	restore() {
		this.ctx.restore()
	}

	// Getters / Setters ----------------

	get stroke() {
		return this._stroke
	}

	set stroke(color: string) {
		this._stroke = color
		this.ctx.strokeStyle = color
	}

	get fill() {
		return this._fill
	}

	set fill(color: string) {
		this._fill = color
		this.ctx.fillStyle = color
	}

	get lineWidth() {
		return this._lineWidth
	}

	set lineWidth(width: number) {
		this._lineWidth = width
		this.ctx.lineWidth = width
	}
}

export default Surface
