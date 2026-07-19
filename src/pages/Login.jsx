import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { signIn, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [signing, setSigning] = useState(false)
  const [error, setError]     = useState(null)

  // Navega cuando auth state confirma que es admin (evita race con popup)
  useEffect(() => {
    if (!loading && isAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [loading, isAdmin, navigate])

  const handleLogin = async () => {
    if (signing) return
    setSigning(true)
    setError(null)
    try {
      await signIn()
      // La navegación la maneja el useEffect de arriba cuando isAdmin se vuelve true
    } catch (e) {
      if (e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo iniciar sesión. Intenta de nuevo.')
        console.error('Login error:', e.code, e.message)
      }
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
        <span className="text-6xl">🔐</span>
        <h1 className="font-heading text-3xl text-purple mt-4">Acceso Admin</h1>
        <p className="font-body text-gray-500 mt-2 text-sm">
          Solo para Valentina Pau Roca
        </p>

        {error && (
          <p className="mt-4 text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={signing || loading}
          className="mt-8 w-full bg-purple hover:bg-purple-dark disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-105 shadow-lg"
        >
          {signing ? 'Abriendo Google...' : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Ingresar con Google
            </>
          )}
        </button>
      </div>
    </div>
  )
}
