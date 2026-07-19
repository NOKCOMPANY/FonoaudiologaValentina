import { Link } from 'react-router-dom'
import { WavyBorder } from '../ui/WavyBorder'

export function Hero() {
  return (
    <section className="relative bg-cream overflow-hidden pt-12 pb-0">
      {/* Decorative blobs */}
      <div className="absolute top-8 left-4 w-20 h-20 bg-pink/20 rounded-full blur-xl" />
      <div className="absolute top-16 right-6 w-28 h-28 bg-teal/20 rounded-full blur-xl" />
      <div className="absolute bottom-16 left-8 w-16 h-16 bg-orange/20 rounded-full blur-xl" />

      <div className="relative max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
        {/* Text */}
        <div className="flex-1 text-center md:text-left">
          {/* Handprint decoration */}
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
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-7 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
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

        {/* Foto Valentina */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple/40 to-pink/40 scale-110 blur-md" />
            <img
              src={`${import.meta.env.BASE_URL}images/valentina.png`}
              alt="Valentina Pau Roca"
              className="relative w-56 h-56 md:w-64 md:h-64 rounded-full object-cover border-4 border-white shadow-xl"
            />
          </div>
          <p className="text-center text-sm text-gray-400 mt-3 font-body">Valentina Pau Roca</p>
          <p className="text-center text-xs text-purple font-bold font-body">Fonoaudióloga</p>
        </div>
      </div>

      <WavyBorder fill="#7C3AED" className="mt-10" />
    </section>
  )
}
