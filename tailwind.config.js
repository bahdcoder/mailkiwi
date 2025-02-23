import twAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {},
      fontFamily: {
        sans: 'var(--default-font-family)',
        display: 'var(--default-font-family-display)',
      },
    },
  },
  plugins: [twAnimate],
}
