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
        drift: {
          '0%, 100%': { transform: 'translateX(0px) translateY(0px)' },
          '33%':       { transform: 'translateX(12px) translateY(-10px)' },
          '66%':       { transform: 'translateX(-8px) translateY(12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':       { opacity: '1',   transform: 'scale(1.15)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'float':        'float 8s ease-in-out infinite',
        'float-slow':   'float 11s ease-in-out infinite',
        'float-slower': 'float 14s ease-in-out infinite',
        'fade-up':      'fade-up 0.5s ease-out both',
        'pulse-soft':   'pulse-soft 2.5s ease-in-out infinite',
        'drift':        'drift 10s ease-in-out infinite',
        'drift-slow':   'drift 15s ease-in-out infinite',
        'drift-slower': 'drift 20s ease-in-out infinite',
        'glow-pulse':   'glow-pulse 3s ease-in-out infinite',
        'spin-slow':    'spin-slow 10s linear infinite',
      },
    },
  },
  plugins: [],
}
