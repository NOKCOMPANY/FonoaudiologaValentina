import { usePrivateEvents } from '../../hooks/useCalendar'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Link } from 'react-router-dom'

function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export function PrivateCalendar({ selectedDate }) {
  const { accessToken } = useAuth()
  const dateStr = selectedDate.toISOString().split('T')[0]
  const { events, loading, error } = usePrivateEvents(accessToken, dateStr)

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-500 text-sm">Error al cargar el calendario.</p>

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <span className="text-5xl">🗓️</span>
        <p className="mt-3 font-body">Sin sesiones para este día</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-4 border-l-4 border-purple"
        >
          <div>
            <p className="font-bold text-gray-800 font-body">{event.summary || 'Sin título'}</p>
            <p className="text-sm text-gray-500">
              {formatTime(event.start?.dateTime)} – {formatTime(event.end?.dateTime)}
            </p>
          </div>
          <Link
            to={`/admin/asistencia?eventId=${event.id}&name=${encodeURIComponent(event.summary ?? '')}`}
            className="bg-purple text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-purple-dark transition"
          >
            Asistencia
          </Link>
        </div>
      ))}
    </div>
  )
}
