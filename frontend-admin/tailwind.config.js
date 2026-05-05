/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        background: 'var(--bg-color)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text-color)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
      },
      animation: {
        'pulse-btn': 'pulse-btn 1.5s infinite',
        'float': 'float 12s infinite ease-in-out alternate',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        'pulse-btn': {
          '0%, 100%': { boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 4px 40px rgba(239, 68, 68, 0.7)' },
        },
        'float': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(40px, 60px) scale(1.15)' },
        },
        'blink': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        }
      }
    },
  },
  plugins: [],
}
