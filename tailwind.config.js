/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Mirrors the prototype's :root CSS variables 1:1, so any NEW component built
      // going forward (beyond the homepage) can use bg-brand-blue, text-brand-navy etc.
      // and stay visually consistent with the homepage without touching raw hex codes.
      colors: {
        brand: {
          blue: '#1457e8',
          navy: '#10264d',
          orange: '#ff7a18',
          bg: '#f6f8fc',
          text: '#172033',
          muted: '#667085',
          green: '#38a169',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
