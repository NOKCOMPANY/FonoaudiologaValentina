import { Link } from 'react-router-dom'
import { WavyBorder } from '../ui/WavyBorder'
import { Bubbles } from '../ui/Bubbles'

export function Hero() {
  return (
    <section
      className="relative overflow-hidden pt-12 pb-0"
      style={{
        background: 'linear-gradient(135deg, #f0e8ff 0%, #fff8f0 45%, #e6f9fd 100%)',
      }}
    >
      {/* Capa de profundidad: burbujas absolutas dentro de la sección */}
      <Bubbles />

      {/* Contenido por encima de las burbujas */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">

        {/* Texto */}
        <div
          className="flex-1 text-center md:text-left animate-fade-up"
          style={{ animationDelay: '0.05s' }}
        >
          <span className="text-4xl select-none">🖐️</span>
          <h1 className="font-heading text-5xl md:text-6xl text-purple leading-tight mt-2">
            ¡Hola! Soy<br />Valentina
          </h1>
          <p className="font-body text-gray-600 text-lg mt-4 max-w-md mx-auto md:mx-0">
            Fonoaudióloga a domicilio, egresada de la{' '}
            <span className="font-bold text-purple">Universidad de Chile</span> y
            certificada en Primeros Auxilios por la Cruz Roja. Acompaño a los más
            pequeños en su desarrollo comunicativo y del lenguaje con actividades
            diseñadas especialmente para cada niño.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center md:justify-start">
            <a
              href="https://wa.me/56962275500"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-7 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 animate-pulse-soft"
            >
              <span>💬</span> WhatsApp
            </a>
            <Link
              to="/disponibilidad"
              className="bg-purple hover:bg-purple-dark text-white font-bold py-3 px-7 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>📅</span> Ver disponibilidad
            </Link>
          </div>

          <p className="text-sm text-gray-400 mt-4">
            ✅ Certificada Cruz Roja Chilena · 🏠 A domicilio
          </p>
        </div>

        {/* Foto con anillo giratorio */}
        <div
          className="flex-shrink-0 flex flex-col items-center animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="relative">
            {/* Anillo giratorio con gradiente cónico */}
            <div
              className="absolute rounded-full ring-spin"
              style={{
                inset: '-6px',
                background: 'conic-gradient(from 0deg, rgba(124,58,237,0.8), rgba(6,182,212,0.7), rgba(236,72,153,0.8), rgba(249,115,22,0.7), rgba(124,58,237,0.8))',
                filter: 'blur(5px)',
              }}
            />
            {/* Halo exterior difuminado */}
            <div
              className="absolute rounded-full animate-glow-pulse"
              style={{
                inset: '-14px',
                background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
              }}
            />
            <img
              src={`${import.meta.env.BASE_URL}images/valentina.png`}
              alt="Valentina Pau Roca"
              className="relative w-56 h-56 md:w-64 md:h-64 rounded-full object-cover border-4 border-white shadow-2xl"
              style={{ zIndex: 1 }}
            />
          </div>
          <p className="text-center text-sm text-gray-400 mt-4 font-body">Valentina Pau Roca</p>
          <p className="text-center text-xs text-purple font-bold font-body">Fonoaudióloga</p>
        </div>
      </div>

      <WavyBorder fill="#7C3AED" className="mt-10" />
    </section>
  )
}
