/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        'surface-alt': 'var(--bg-surface-alt)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        subtle: 'var(--border-subtle)',
        'subtle-hover': 'var(--border-subtle-hover)',
        hover: 'var(--bg-hover)',
      }
    },
  },
  plugins: [],
}
