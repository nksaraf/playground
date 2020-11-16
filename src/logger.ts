import log from "ololog"

class Grid {
	rows = []
	width = 0
	height = 0

	chars = {
		active: ["┌", "─", "┒", "┃", "┛", "━", "┕", "│"],
		inactive: ["┌", "─", "┐", "│", "┘", "─", "└", "│"],
		root: ["┌", "╌", "┐", "╎", "┘", "╌", "└", "╎"],
	}

	setSize(width, height) {
		this.rows = Array.from(Array(height)).map(() =>
			Array.from(Array(width)).map(() => ({ char: " ", node: undefined }))
		)
	}

	insert(char, col, row, node) {
		if (this.rows[row] === undefined) this.rows[row] = []
		this.rows[row][col] = { char, node }
	}

	drawRect(x, y, width, height, style, node) {
		let i
		const chars = this.chars[style]
		this.insert(chars[0], x, y, node)
		this.insert(chars[2], x + width, y, node)
		this.insert(chars[4], x + width, y + height, node)
		this.insert(chars[6], x, y + height, node)
		for (i = 1; i < width; i++) {
			this.insert(chars[1], x + i, y, node)
			this.insert(chars[5], x + i, y + height, node)
		}
		for (i = 1; i < height; i++) {
			this.insert(chars[7], x, y + i, node)
			this.insert(chars[3], x + width, y + i, node)
		}
	}

	drawText(text, x, y, node) {
		for (let i = 0; i < text.length; i++) {
			this.insert(text[i], x + i, y, node)
		}
	}

	drawNode(node) {
		const { x, y, width, height, type, state, name } = node
		const style =
			type === "root" ? "root" : state.active ? "active" : "inactive"
		if (node.hasChildren) {
			this.drawRect(x, y, width, height, style, node)
			this.insert(" ", x + 1, y, node)
			this.insert(" ", x + name.length + 2, y, node)
			this.drawText(name, x + 2, y, node)
		} else {
			this.drawText(name, x, y, node)
		}

		for (let child of node.children) {
			this.drawNode(child)
		}
	}

	render() {
		console.clear()
		log(
			this.rows
				.map((row) =>
					row
						.map((cell) =>
							cell
								? cell.node?.state.active
									? `\x1b[0;37m${cell.char}\x1b[0m`
									: `\x1b[0;37;2m${cell.char}\x1b[0m`
								: " "
						)
						.join("")
				)
				.join("\n")
		)
	}

	init(node) {
		node.moveTo(0, 0)
		this.setSize(node.width, node.height)
		this.drawNode(node)
		this.render()
	}
}

const grid = new Grid()

class TNode {
	x = 0
	y = 0
	children: any
	name: any
	state: any
	parent: any

	constructor(state, parent?: any) {
		this.state = state
		this.name = state.name
		this.parent = parent
		this.children = Object.values(state.states).map((s) => new TNode(s, this))
	}

	get maxX() {
		return this.x + this.width
	}

	get maxY() {
		return this.y + this.height
	}

	get width() {
		if (!this.hasChildren) {
			return this.name.length
		}

		let cx = Math.max(
			this.x + this.name.length + 5,
			...this.children.map((c) => c.maxX)
		)

		if (this.children.find((c) => c.type === "branch")) cx++

		cx++

		return cx - this.x
	}

	get height() {
		if (!this.hasChildren) {
			return 1
		}

		let cy = Math.max(...this.children.map((c) => c.maxY))
		if (cy > this.y + 2) cy++

		return cy - this.y
	}

	get hasChildren() {
		return this.children.length > 0
	}

	get type() {
		if (!this.parent) return "root"
		if (this.children.length === 0) return "leaf"
		return "branch"
	}

	moveTo(x, y) {
		this.x = x
		this.y = y

		let cw = 0
		let ch = 0
		let sy = 1

		for (let i = 0; i < this.children.length; i++) {
			const child = this.children[i]

			child.moveTo(x + 2 + cw, y + sy)

			ch = Math.max(ch, child.height + (child.type === "leaf" ? 0 : 1))

			if (cw < 32) {
				cw += child.width + (child.type === "leaf" ? 1 : 2)
			} else {
				cw = 0
				sy += ch
			}
		}
	}
}

export default function renderState(state) {
	const tree = new TNode(state.stateTree)
	grid.init(tree)
	grid.render()
	return state.onUpdate(() => grid.render())
}
