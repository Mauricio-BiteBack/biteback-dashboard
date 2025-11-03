/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bitepurple: "#742cff",
        biteorange: "#fd6429",
        bitebg: "#fffbf7",
        bitedark: "#072049",
      },
    },
  },
  plugins: [],
};