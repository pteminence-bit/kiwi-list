/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kiwi: {
          light: '#8ee4af',
          DEFAULT: '#5cdb95',
          dark: '#379683',
        }
      }
    },
  },
  plugins: [],
}
