/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        pulse: {
          blue: '#1e40af',
          sky: '#0284c7',
          emerald: '#059669',
          amber: '#d97706',
          rose: '#e11d48',
          slate: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}

