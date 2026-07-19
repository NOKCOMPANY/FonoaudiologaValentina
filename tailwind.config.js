/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        purple: { DEFAULT: '#7C3AED', light: '#A78BFA', dark: '#5B21B6' },
        orange: { DEFAULT: '#F97316', light: '#FED7AA' },
        teal:   { DEFAULT: '#06B6D4', light: '#A5F3FC' },
        pink:   { DEFAULT: '#EC4899', light: '#FBCFE8' },
        cream:  { DEFAULT: '#FFF8F0' },
      },
      fontFamily: {
        heading: ['"Fredoka One"', 'cursive'],
        body:    ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
