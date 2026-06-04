/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      colors: {
        bg: "#0a0d14",
        surface: "#1a2035",
        border: "#2a3352",
        accent: "#6366f1",
        accent2: "#8b5cf6",
      },
    },
  },
  plugins: [],
};
