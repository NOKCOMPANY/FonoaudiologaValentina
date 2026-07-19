import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.hash === `#${path}` || (path === '/' && location.hash === '')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🖐️</span>
          <span className="font-heading text-purple text-lg leading-none">Valentina</span>
          <span className="text-gray-400 text-xs font-body hidden sm:block">Fonoaudióloga</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/"
            className={`text-sm font-body font-bold px-3 py-1.5 rounded-full transition ${
              isActive('/') ? 'bg-purple text-white' : 'text-gray-600 hover:text-purple'
            }`}
          >
            Inicio
          </Link>
          <Link
            to="/disponibilidad"
            className={`text-sm font-body font-bold px-3 py-1.5 rounded-full transition ${
              isActive('/disponibilidad') ? 'bg-purple text-white' : 'text-gray-600 hover:text-purple'
            }`}
          >
            Disponibilidad
          </Link>

          {/* Admin area */}
          {user && isAdmin ? (
            <div className="flex items-center gap-2 ml-2">
              <Link
                to="/admin"
                className="text-sm font-body font-bold px-3 py-1.5 bg-purple text-white rounded-full hover:bg-purple-dark transition"
              >
                Admin
              </Link>
              <button
                onClick={signOut}
                className="text-xs text-gray-400 hover:text-red-400 transition"
                title="Cerrar sesión"
              >
                ✕
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-gray-300 hover:text-purple text-lg transition ml-2"
              title="Acceso administrador"
            >
              🔒
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
