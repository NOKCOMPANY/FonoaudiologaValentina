/**
 * colorMaps.js — Sistema de colores centralizado
 *
 * Todas las clases Tailwind aparecen como strings literales aquí,
 * por lo que el scanner estático las detecta sin necesidad de safelist.
 *
 * Variantes disponibles por color:
 *   badge  — badge de tipo (fondo suave, borde, texto)
 *   avatar — avatar de paciente (fondo suave, borde, texto)
 *   bar    — barra de progreso (bg sólido)
 *   text   — texto coloreado bold
 *   border — borde izquierdo (border-l-*)
 *   dot    — punto indicador (bg sólido)
 *   rgb    — array [r, g, b] para jsPDF
 */

export const COLORS = {
  teal: {
    badge:  'bg-teal/10 text-teal border-teal/30',
    avatar: 'bg-teal/15 border-teal/30 text-teal',
    bar:    'bg-teal',
    text:   'text-teal font-bold',
    border: 'border-l-teal',
    dot:    'bg-teal',
    rgb:    [20, 184, 166],
  },
  purple: {
    badge:  'bg-purple/10 text-purple border-purple/30',
    avatar: 'bg-purple/15 border-purple/30 text-purple',
    bar:    'bg-purple',
    text:   'text-purple font-bold',
    border: 'border-l-purple',
    dot:    'bg-purple',
    rgb:    [124, 58, 237],
  },
  orange: {
    badge:  'bg-orange/10 text-orange border-orange/30',
    avatar: 'bg-orange/15 border-orange/30 text-orange',
    bar:    'bg-orange',
    text:   'text-orange font-bold',
    border: 'border-l-orange',
    dot:    'bg-orange',
    rgb:    [249, 115, 22],
  },
  blue: {
    badge:  'bg-blue-100 text-blue-600 border-blue-200',
    avatar: 'bg-blue-100 border-blue-300 text-blue-600',
    bar:    'bg-blue-400',
    text:   'text-blue-600 font-bold',
    border: 'border-l-blue-400',
    dot:    'bg-blue-400',
    rgb:    [59, 130, 246],
  },
  pink: {
    badge:  'bg-pink-100 text-pink-600 border-pink-200',
    avatar: 'bg-pink-100 border-pink-300 text-pink-500',
    bar:    'bg-pink-400',
    text:   'text-pink-500 font-bold',
    border: 'border-l-pink-400',
    dot:    'bg-pink-400',
    rgb:    [236, 72, 153],
  },
  green: {
    badge:  'bg-green-100 text-green-700 border-green-200',
    avatar: 'bg-green-100 border-green-300 text-green-600',
    bar:    'bg-green-500',
    text:   'text-green-600 font-bold',
    border: 'border-l-green-500',
    dot:    'bg-green-500',
    rgb:    [34, 197, 94],
  },
  gray: {
    badge:  'bg-gray-100 text-gray-500 border-gray-200',
    avatar: 'bg-gray-100 border-gray-200 text-gray-500',
    bar:    'bg-gray-300',
    text:   'text-gray-500 font-bold',
    border: 'border-l-gray-300',
    dot:    'bg-gray-400',
    rgb:    [156, 163, 175],
  },
  red: {
    badge:  'bg-red-100 text-red-600 border-red-200',
    avatar: 'bg-red-100 border-red-300 text-red-600',
    bar:    'bg-red-400',
    text:   'text-red-600 font-bold',
    border: 'border-l-red-400',
    dot:    'bg-red-400',
    rgb:    [239, 68, 68],
  },
  yellow: {
    badge:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    avatar: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    bar:    'bg-yellow-400',
    text:   'text-yellow-600 font-bold',
    border: 'border-l-yellow-400',
    dot:    'bg-yellow-400',
    rgb:    [234, 179, 8],
  },
  indigo: {
    badge:  'bg-indigo-100 text-indigo-600 border-indigo-200',
    avatar: 'bg-indigo-100 border-indigo-300 text-indigo-600',
    bar:    'bg-indigo-400',
    text:   'text-indigo-600 font-bold',
    border: 'border-l-indigo-400',
    dot:    'bg-indigo-400',
    rgb:    [99, 102, 241],
  },
  cyan: {
    badge:  'bg-cyan-100 text-cyan-600 border-cyan-200',
    avatar: 'bg-cyan-100 border-cyan-300 text-cyan-600',
    bar:    'bg-cyan-400',
    text:   'text-cyan-600 font-bold',
    border: 'border-l-cyan-400',
    dot:    'bg-cyan-400',
    rgb:    [34, 211, 238],
  },
  violet: {
    badge:  'bg-violet-100 text-violet-600 border-violet-200',
    avatar: 'bg-violet-100 border-violet-300 text-violet-600',
    bar:    'bg-violet-400',
    text:   'text-violet-600 font-bold',
    border: 'border-l-violet-400',
    dot:    'bg-violet-400',
    rgb:    [139, 92, 246],
  },
  lime: {
    badge:  'bg-lime-100 text-lime-700 border-lime-200',
    avatar: 'bg-lime-100 border-lime-300 text-lime-700',
    bar:    'bg-lime-500',
    text:   'text-lime-600 font-bold',
    border: 'border-l-lime-500',
    dot:    'bg-lime-500',
    rgb:    [132, 204, 22],
  },
  rose: {
    badge:  'bg-rose-100 text-rose-600 border-rose-200',
    avatar: 'bg-rose-100 border-rose-300 text-rose-600',
    bar:    'bg-rose-400',
    text:   'text-rose-600 font-bold',
    border: 'border-l-rose-400',
    dot:    'bg-rose-400',
    rgb:    [251, 113, 133],
  },
}

export const COLOR_NAMES = Object.keys(COLORS)

/**
 * Obtiene una variante de color por nombre.
 * Fallback: gray si el color no existe.
 * @param {string} name   — nombre del color (ej: 'teal', 'red')
 * @param {string} variant — variante (badge | avatar | bar | text | border | dot | rgb)
 */
export const colorVariant = (name, variant) => COLORS[name]?.[variant] ?? COLORS.gray[variant]
