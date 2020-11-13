import { IBox, IArrow, IArrowType } from "../../types"

const RESET_LOCAL_DATA = true

export const LOCAL_STORAGE_KEY = "perfect_arrows_example"

/**
 * Save something to the "database"
 * @param data
 */
export function saveToDatabase(data: string) {
	localStorage.setItem(LOCAL_STORAGE_KEY, data)
}

/**
 * Get the initial data for the store.
 */
// export function getInitialData(): any {
// 	let previous: string | null = null
// 	let initial: {
// 		boxes: Record<string, IBox>
// 		arrows: Record<string, IArrow>
// 	}

// 	// if (typeof window !== undefined) {
// 	// 	if (typeof window.localStorage !== undefined) {
// 	// 		previous = localStorage.getItem(LOCAL_STORAGE_KEY)
// 	// 	}
// 	// }

// 	if (previous === null || RESET_LOCAL_DATA) {
// 		// Initial Boxes
// 		// const initBoxes = {
// 		//   box_a0: {
// 		//     id: "box_a0",
// 		//     x: 100,
// 		//     y: 100,
// 		//     width: 100,
// 		//     height: 100,
// 		//     label: "",
// 		//     color: "rgba(255, 255, 255, 1)",
// 		//     z: 0,
// 		//   },
// 		//   box_a1: {
// 		//     id: "box_a1",
// 		//     x: 200,
// 		//     y: 300,
// 		//     width: 100,
// 		//     height: 100,
// 		//     label: "",
// 		//     color: "rgba(255, 255, 255, 1)",
// 		//     z: 1,
// 		//   },
// 		// }

// 		// Stress Test! Can do about 5000 boxes easily.

// 		}

// 		initial = {
// 			boxes: [],
// 			arrows: [],
// 		}
// 	} else {
// 		initial = JSON.parse(previous)
// 	}

// 	return initial
// }
