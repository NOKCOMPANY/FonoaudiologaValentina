import { useAuth } from '../../context/AuthContext'

export function TokenRefreshBanner() {
  const { needsTokenRefresh, refreshCalendarToken } = useAuth()

  if (!needsTokenRefresh) return null

  return (
    <div className="bg-orange/10 border border-orange/30 rounded-2xl p-4 flex items-center justify-between gap-4 mb-6">
      <div>
        <p className="font-bold text-orange text-sm">Sesión de Google Calendar expirada</p>
        <p className="text-gray-500 text-xs mt-0.5">Reconecta para ver las sesiones del calendario</p>
      </div>
      <button
        onClick={refreshCalendarToken}
        className="bg-orange text-white text-sm font-bold px-4 py-2 rounded-full hover:opacity-90 transition whitespace-nowrap"
      >
        Reconectar
      </button>
    </div>
  )
}
