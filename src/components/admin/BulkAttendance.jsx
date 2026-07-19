import { useState, useCallback } from 'react'
import { getPrivateEvents } from '../../lib/googleCalendar'
import { parseEvent } from '../../lib/parseEvent'
import { getSessionsByPatient, markAttendanceWithPatient } from '../../hooks/useFirestore'
import { colorVariant } from '../../lib/colorMaps'

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso) {
  if (!iso?.includes('T')) return '—'
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(iso) {
  if (!iso?.includes('T')) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Estado de asistencia posibles
const STATUS = { PENDING: null, ATTENDED: true, ABSENT: false }

function getInitialStatus(existing) {
  if (!existing) return STATUS.PENDING
  return existing.attended ? STATUS.ATTENDED : STATUS.ABSENT
}

export function BulkAttendance({ accessToken, serviceTypes = [], patients = [], onSaved }) {
  const [open, setOpen]               = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const now = new Date()
  const firstOfMonth = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1))
  const [dateFrom, setDateFrom]       = useState(firstOfMonth)
  const [dateTo, setDateTo]           = useState(toLocalDateStr(now))
  const [sessions, setSessions]       = useState([])   // { eventId, startISO, endISO, type, patientId, patientName, status, original }
  const [loading, setLoading]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)
  const [saveResult, setSaveResult]   = useState(null) // { ok: N, fail: N }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  const handleLoad = useCallback(async () => {
    if (!accessToken || !selectedPatientId) return
    setLoading(true); setError(null); setSaveResult(null); setSessions([])

    try {
      const timeMin = new Date(dateFrom + 'T00:00:00').toISOString()
      const timeMax = new Date(dateTo   + 'T23:59:59').toISOString()

      const [calData, existingSessions] = await Promise.all([
        getPrivateEvents(accessToken, timeMin, timeMax),
        getSessionsByPatient(selectedPatientId),
      ])

      const events    = calData.items ?? []
      const existingMap = Object.fromEntries(existingSessions.map((s) => [s.calendarEventId ?? s.id, s]))

      // Filtrar solo los eventos del paciente seleccionado
      const filtered = events
        .filter((ev) => {
          if (!ev.start?.dateTime) return false  // excluir día completo
          const parsed = parseEvent(ev.summary ?? '')
          return parsed.patientId === selectedPatientId
        })
        .map((ev) => {
          const parsed   = parseEvent(ev.summary ?? '')
          const existing = existingMap[ev.id]
          return {
            eventId:     ev.id,
            startISO:    ev.start.dateTime,
            endISO:      ev.end?.dateTime ?? ev.start.dateTime,
            type:        existing?.type || parsed.typeName || 'Sin clasificar',
            patientId:   parsed.patientId   || selectedPatientId,
            patientName: parsed.patientName || selectedPatient?.fullName || selectedPatient?.name || selectedPatientId,
            status:      getInitialStatus(existing),   // null | true | false
            original:    getInitialStatus(existing),   // para detectar modificados
          }
        })
        .sort((a, b) => new Date(a.startISO) - new Date(b.startISO))

      setSessions(filtered)
    } catch (e) {
      setError(e.message ?? 'Error al cargar sesiones')
    } finally {
      setLoading(false)
    }
  }, [accessToken, selectedPatientId, dateFrom, dateTo, selectedPatient])

  const setStatus = (idx, newStatus) => {
    setSessions((prev) => prev.map((s, i) => i === idx ? { ...s, status: newStatus } : s))
  }

  const modifiedCount = sessions.filter((s) => s.status !== s.original).length

  const handleSave = async () => {
    const toSave = sessions.filter((s) => s.status !== s.original && s.status !== STATUS.PENDING)
    if (toSave.length === 0) return
    setSaving(true); setError(null); setSaveResult(null)

    let ok = 0; let fail = 0
    await Promise.allSettled(
      toSave.map(async (s) => {
        try {
          await markAttendanceWithPatient(s.eventId, s.patientId, s.patientName, s.status, '', s.type, s.startISO)
          ok++
        } catch {
          fail++
        }
      })
    )

    setSaveResult({ ok, fail })
    setSaving(false)

    if (ok > 0) {
      if (onSaved) onSaved()           // notifica a Admin → PrivateCalendar refresca
      await handleLoad()               // refresca la propia lista de BulkAttendance
    }
  }

  const stColor  = (name) => serviceTypes.find((st) => st.displayName === name)?.color ?? 'gray'
  const badgeOf  = (name) => colorVariant(stColor(name), 'badge')

  return (
    <div className="rounded-2xl border border-purple/20 bg-white mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition"
      >
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          📋 Asistencia masiva por paciente
          {modifiedCount > 0 && !saving && (
            <span className="text-xs font-bold bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
              {modifiedCount} pendiente{modifiedCount !== 1 ? 's' : ''}
            </span>
          )}
        </span>
        <span className="text-purple">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-5 border-t border-purple/10 pt-4 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs flex justify-between">
              {error} <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {saveResult && (
            <div className={`rounded-xl px-3 py-2 text-xs font-bold flex justify-between ${
              saveResult.fail > 0 ? 'bg-orange/10 border border-orange/30 text-orange' : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {saveResult.fail === 0
                ? `✅ ${saveResult.ok} sesión${saveResult.ok !== 1 ? 'es' : ''} guardada${saveResult.ok !== 1 ? 's' : ''} correctamente`
                : `⚠ ${saveResult.ok} guardadas · ${saveResult.fail} fallaron`
              }
              <button onClick={() => setSaveResult(null)}>✕</button>
            </div>
          )}

          {/* Controles */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Paciente</label>
              <select
                value={selectedPatientId}
                onChange={(e) => { setSelectedPatientId(e.target.value); setSessions([]); setSaveResult(null) }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 bg-white"
              >
                <option value="">— Seleccionar paciente —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName || p.name || p.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setSessions([]) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setSessions([]) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleLoad}
            disabled={loading || !selectedPatientId || !accessToken}
            className="text-xs bg-purple/10 hover:bg-purple/20 text-purple font-bold px-4 py-1.5 rounded-full transition disabled:opacity-40"
          >
            {loading ? '⏳ Cargando...' : '📅 Cargar sesiones'}
          </button>

          {!accessToken && (
            <p className="text-xs text-orange">Sin token de calendario — iniciá sesión con Google.</p>
          )}

          {/* Lista de sesiones */}
          {sessions.length === 0 && !loading && selectedPatientId && (
            <p className="text-xs text-gray-400 text-center py-3">
              Sin sesiones con horario definido en este período para este paciente.
            </p>
          )}

          {sessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} encontradas</p>

              {sessions.map((s, idx) => {
                const isModified = s.status !== s.original
                return (
                  <div
                    key={s.eventId}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                      isModified ? 'border-purple/30 bg-purple/5' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    {/* Info de la sesión */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeOf(s.type)}`}>
                          {s.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateLabel(s.startISO)} · {formatTime(s.startISO)}–{formatTime(s.endISO)}
                        </span>
                        {isModified && <span className="text-xs text-purple font-bold">✎</span>}
                      </div>
                    </div>

                    {/* Botones de estado */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setStatus(idx, STATUS.ATTENDED)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                          s.status === STATUS.ATTENDED
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600'
                        }`}
                        title="Asistió"
                      >✓</button>
                      <button
                        onClick={() => setStatus(idx, STATUS.ABSENT)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                          s.status === STATUS.ABSENT
                            ? 'bg-red-400 text-white border-red-400'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500'
                        }`}
                        title="Ausente"
                      >✗</button>
                      <button
                        onClick={() => setStatus(idx, STATUS.PENDING)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                          s.status === STATUS.PENDING
                            ? 'bg-gray-200 text-gray-500 border-gray-300'
                            : 'bg-white text-gray-300 border-gray-200 hover:border-gray-300 hover:text-gray-500'
                        }`}
                        title="Sin marcar"
                      >—</button>
                    </div>
                  </div>
                )
              })}

              {/* Botón guardar */}
              <div className="pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving || modifiedCount === 0}
                  className="text-xs bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-4 py-2 rounded-full transition"
                >
                  {saving ? '⏳ Guardando...' : `💾 Guardar cambios${modifiedCount > 0 ? ` (${modifiedCount})` : ''}`}
                </button>
                {modifiedCount === 0 && sessions.length > 0 && (
                  <span className="text-xs text-gray-400 ml-3">Sin cambios pendientes</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
