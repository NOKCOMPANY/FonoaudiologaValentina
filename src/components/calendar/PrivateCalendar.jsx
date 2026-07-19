import { useState, useEffect } from 'react'
import { usePrivateEvents } from '../../hooks/useCalendar'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { parseEvent } from '../../lib/parseEvent'
import { markAttendanceWithPatient, getSessionsInRange, updateSessionType } from '../../hooks/useFirestore'
import { colorVariant } from '../../lib/colorMaps'
import { detectRecargos } from '../../lib/recargoRules'

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

const DEFAULT_BADGE  = colorVariant('gray', 'badge')
const DEFAULT_BORDER = colorVariant('gray', 'border')

function SessionCard({ event, existingSession, serviceTypes = [], recargoRules }) {
  const parsed    = parseEvent(event.summary ?? '')
  // El tipo del documento Firestore tiene precedencia sobre el título del calendario
  const resolvedType = existingSession?.type || parsed.typeName

  // Lookup dinámico de estilos desde colorMaps centralizado
  const stColor  = (name) => serviceTypes.find((s) => s.displayName === name)?.color ?? 'gray'
  const badgeOf  = (name) => colorVariant(stColor(name), 'badge')
  const borderOf = (name) => colorVariant(stColor(name), 'border')

  const [status, setStatus]           = useState(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [editing, setEditing]         = useState(false)
  const [error, setError]             = useState(null)
  const [notes, setNotes]             = useState('')
  const [showNotes, setShowNotes]     = useState(false)

  // Reclasificación
  const [showRetype, setShowRetype]   = useState(false)
  const [pendingType, setPendingType] = useState(null)
  const [retyping, setRetyping]       = useState(false)
  const [currentType, setCurrentType] = useState(resolvedType)

  // Opciones de reclasificación: todos los tipos definidos en Firestore
  const typeOptions = serviceTypes.map((s) => s.displayName)

  // Detección de recargos y advertencias
  const stObj   = serviceTypes.find((s) => s.displayName === currentType)
  const { esFds, esFuera } = detectRecargos(event.start?.dateTime, recargoRules)
  const warnFds   = esFds   && !stObj?.recargoFds?.activo
  const warnFuera = esFuera && !stObj?.recargoFuera?.activo

  useEffect(() => {
    if (existingSession) {
      setStatus(existingSession.attended ? 'attended' : 'absent')
      setSaved(true)
      setNotes(existingSession.notes ?? '')
      setCurrentType(existingSession.type || parsed.typeName)
    }
  }, [existingSession])

  const register = async (attended) => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await markAttendanceWithPatient(
        event.id, parsed.patientId, parsed.patientName, attended, notes, currentType,
        event.start?.dateTime ?? event.start?.date ?? null
      )
      setStatus(attended ? 'attended' : 'absent')
      setSaved(true)
      setEditing(false)
    } catch (e) {
      setError(`[${e.code ?? 'error'}] ${e.message ?? 'Error al guardar'}`)
    } finally {
      setSaving(false)
    }
  }

  const confirmRetype = async () => {
    if (!pendingType || retyping) return
    setRetyping(true)
    try {
      await updateSessionType(event.id, pendingType)
      setCurrentType(pendingType)
      setShowRetype(false)
      setPendingType(null)
    } catch (e) {
      setError(`[${e.code ?? 'error'}] ${e.message ?? 'Error al reclasificar'}`)
    } finally {
      setRetyping(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${borderOf(currentType)} overflow-hidden`}>
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeOf(currentType)}`}>
              {currentType}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(event.start?.dateTime)} – {formatTime(event.end?.dateTime)}
            </span>
            {/* Botón reclasificar — solo si ya está guardado */}
            {saved && (
              <button
                onClick={() => { setShowRetype((v) => !v); setPendingType(null) }}
                className="text-gray-300 hover:text-purple text-xs transition"
                title="Cambiar tipo de servicio"
              >
                🏷️
              </button>
            )}
          </div>
          <p className="font-bold text-gray-800 truncate">
            {parsed.patientName || event.summary || 'Sin título'}
          </p>
          <p className="text-xs mt-0.5">
            {parsed.typeName !== 'Sin clasificar'
              ? <span className="text-gray-400">{currentType} · {parsed.patientName}</span>
              : <span className="text-orange font-medium">⚠ Sin clasificar — renombrar (ej: "BS Nombre")</span>
            }
          </p>
          {(warnFds || warnFuera) && (
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {warnFds && (
                <span className="text-xs font-bold bg-orange/10 text-orange border border-orange/30 px-2 py-0.5 rounded-full">
                  🟠 Fin de semana · sin recargo configurado
                </span>
              )}
              {warnFuera && (
                <span className="text-xs font-bold bg-teal/10 text-teal border border-teal/30 px-2 py-0.5 rounded-full">
                  🕗 Fuera de horario · sin recargo configurado
                </span>
              )}
            </div>
          )}
        </div>

        {saved && !editing ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              status === 'attended' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {status === 'attended' ? '✅ Completado' : '❌ No efectuada'}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-500 px-2 py-1 rounded-full transition"
              title="Editar asistencia"
            >
              ✏️
            </button>
          </div>
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
            {!editing && (
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="text-gray-400 hover:text-gray-600 text-xs px-2 py-2 rounded-full transition"
                title="Agregar nota"
              >
                📝
              </button>
            )}
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-full transition"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Panel de notas */}
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

      {/* Panel de reclasificación */}
      {showRetype && saved && (
        <div className="px-4 pb-4 border-t border-orange/20 pt-3 bg-orange/5">
          <p className="text-xs text-orange font-bold mb-2">⚠️ Cambiar tipo de servicio registrado</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {typeOptions.map((t) => (
              <button
                key={t}
                onClick={() => setPendingType(t)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                  pendingType === t
                    ? `${badgeOf(t)} ring-2 ring-offset-1 ring-current`
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {pendingType && (
            <button
              onClick={confirmRetype}
              disabled={retyping}
              className="text-xs bg-orange hover:bg-orange/80 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-full transition"
            >
              {retyping ? 'Guardando...' : `Confirmar → ${pendingType}`}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="px-4 pb-3 flex items-start gap-2">
          <p className="flex-1 text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2 font-mono">{error}</p>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-xs bg-red-100 hover:bg-red-200 text-red-600 font-bold px-3 py-2 rounded-full transition"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export function PrivateCalendar({ selectedDate, serviceTypes = [], refreshKey = 0, recargoRules }) {
  const { accessToken } = useAuth()
  const dateStr = toLocalDateStr(selectedDate)
  const { events, loading, error } = usePrivateEvents(accessToken, dateStr)
  const [sessionMap, setSessionMap] = useState({})

  useEffect(() => {
    const dayStart = new Date(selectedDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(selectedDate)
    dayEnd.setHours(23, 59, 59, 999)
    getSessionsInRange(dayStart, dayEnd)
      .then((sessions) => {
        const map = {}
        sessions.forEach((s) => { map[s.calendarEventId] = s })
        setSessionMap(map)
      })
      .catch(() => {})
  }, [selectedDate, refreshKey])  // refreshKey fuerza re-fetch cuando BulkAttendance guarda

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
        <SessionCard key={event.id} event={event} existingSession={sessionMap[event.id]} serviceTypes={serviceTypes} recargoRules={recargoRules} />
      ))}
    </div>
  )
}
