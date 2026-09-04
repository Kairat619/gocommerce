import tokens from "./src/theme/tokens/index.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      maxWidth: tokens.maxWidth,
      keyframes: tokens.keyframes,
      animation: tokens.animation,
    },
  },
  plugins: [],
};
