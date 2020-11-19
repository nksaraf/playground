const colors = require("tailwindcss/colors");
module.exports = {
  future: {
    purgeLayersByDefault: true,
  },
  purge: ["./src/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      ...colors,
      transparent: "transparent",
      gray: colors.blueGray,
      blue: colors.lightBlue,
    },
    extend: {},
  },
  variants: {},
  plugins: [],
};
