/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          bg: '#FAF8F5',
          card: '#F4F0E8',
          border: '#E6E2DA',
          text: '#1F1E1D',
          muted: '#6E6A64'
        },
        charcoal: {
          bg: '#141311',
          card: '#1D1B18',
          border: '#2A2723',
          text: '#F2EFE9',
          muted: '#8C877D'
        },
        accent: {
          DEFAULT: '#10B981',
          hover: '#059669',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    }
  },
  plugins: [],
}
