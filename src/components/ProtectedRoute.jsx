import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './ui/LoadingSpinner'

export function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-center px-4">
        <div>
          <span className="text-5xl">🚫</span>
          <h2 className="font-heading text-2xl text-purple mt-4">Acceso denegado</h2>
          <p className="text-gray-500 mt-2">Esta sección es solo para Valentina.</p>
        </div>
      </div>
    )
  }

  return children
}
