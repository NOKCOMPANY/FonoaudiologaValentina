import { useState } from 'react'
import { usePrivateEvents } from '../../hooks/useCalendar'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { parseEvent } from '../../lib/parseEvent'
import { markAttendanceWithPatient } from '../../hooks/useFirestore'
import { TYPE_LABEL } from '../../lib/constants'

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

const TYPE_STYLES = {
  Taller:     { badge: 'bg-orange/10 text-orange border-orange/30',   border: 'border-l-orange' },
  Babysitter: { badge: 'bg-teal/10 text-teal border-teal/30',         border: 'border-l-teal' },
  Terapia:    { badge: 'bg-purple/10 text-purple border-purple/30',   border: 'border-l-purple' },
}
const DEFAULT_STYLE = { badge: 'bg-gray-100 text-gray-500 border-gray-200', border: 'border-l-gray-300' }

function SessionCard({ event }) {
  const parsed    = parseEvent(event.summary ?? '')
  const styles    = TYPE_STYLES[parsed.typeName] ?? DEFAULT_STYLE
  const typeLabel = TYPE_LABEL[parsed.typeName] ?? parsed.typeName

  const [status, setStatus]       = useState(null)   // null | 'attended' | 'absent'
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)
  const [notes, setNotes]         = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const register = async (attended) => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await markAttendanceWithPatient(event.id, parsed.patientId, parsed.patientName, attended, notes, parsed.typeName)
      setStatus(attended ? 'attended' : 'absent')
      setSaved(true)
    } catch (e) {
      setError(`[${e.code ?? 'error'}] ${e.message ?? 'Error al guardar'}`)
    } finally {
      setSaving(false)
    }
  }

  const retry = () => {
    setError(null)
    setSaving(false)
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${styles.border} overflow-hidden`}>
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
              {typeLabel}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(event.start?.dateTime)} – {formatTime(event.end?.dateTime)}
            </span>
          </div>
          <p className="font-bold text-gray-800 truncate">
            {parsed.patientName || event.summary || 'Sin título'}
          </p>
          <p className="text-xs mt-0.5">
            {parsed.typeName !== 'Sin clasificar'
              ? <span className="text-gray-400">{typeLabel} · {parsed.patientName}</span>
              : <span className="text-orange font-medium">⚠ Sin clasificar — renombrar (ej: "BS Nombre")</span>
            }
          </p>
        </div>

        {saved ? (
          <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${
            status === 'attended' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {status === 'attended' ? '✅ Asistió' : '❌ No asistió'}
          </span>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => register(true)}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-full transition"
            >
              {saving ? '⏳' : '✅'}
            </button>
            <button
              onClick={() => register(false)}
              disabled={saving}
              className="bg-red-400 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-full transition"
            >
              {saving ? '⏳' : '❌'}
            </button>
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="text-gray-400 hover:text-gray-600 text-xs px-2 py-2 rounded-full transition"
              title="Agregar nota"
            >
              📝
            </button>
          </div>
        )}
      </div>

      {showNotes && !saved && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nota de la sesión (opcional)..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple/30"
          />
        </div>
      )}

      {error && (
        <div className="px-4 pb-3 flex items-start gap-2">
          <p className="flex-1 text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2 font-mono">{error}</p>
          <button
            onClick={retry}
            className="flex-shrink-0 text-xs bg-red-100 hover:bg-red-200 text-red-600 font-bold px-3 py-2 rounded-full transition"
          >
            🔄 Reintentar
          </button>
        </div>
      )}
    </div>
  )
}

export function PrivateCalendar({ selectedDate }) {
  const { accessToken } = useAuth()
  const dateStr = toLocalDateStr(selectedDate)
  const { events, loading, error } = usePrivateEvents(accessToken, dateStr)

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">
      <p className="font-bold">Error al cargar el calendario</p>
      <p className="text-xs mt-1 font-mono">{error.message}</p>
    </div>
  )

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <span className="text-5xl">🗓️</span>
        <p className="mt-3">Sin sesiones para este día</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <SessionCard key={event.id} event={event} />
      ))}
    </div>
  )
}
