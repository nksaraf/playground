module.exports = {
	future: {
		removeDeprecatedGapUtilities: true,
		purgeLayersByDefault: true,
	},
	purge: ["./lib/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				canvas: "#F6F9FA",
				"canvas-grid": "#F6F9FA",
			},
		},
	},
	variants: {},
	plugins: [],
}
