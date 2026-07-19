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
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-18px)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.25)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(124,58,237,0)' },
        },
      },
      animation: {
        'float':        'float 8s ease-in-out infinite',
        'float-slow':   'float 11s ease-in-out infinite',
        'float-slower': 'float 14s ease-in-out infinite',
        'fade-up':      'fade-up 0.5s ease-out both',
        'pulse-soft':   'pulse-soft 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
