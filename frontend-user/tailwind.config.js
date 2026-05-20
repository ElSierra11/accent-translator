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
        display: ['Outfit', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
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
        'pulse-btn': 'pulse-btn 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        'pulse-btn': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: .9, transform: 'scale(1.02)' },
        },
        'fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
