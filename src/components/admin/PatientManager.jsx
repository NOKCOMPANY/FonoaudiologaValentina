import { useState, useEffect } from 'react'
import { getAllPatients, updatePatientInfo } from '../../hooks/useFirestore'
import { getPrivateEvents } from '../../lib/googleCalendar'
import { parseEvent } from '../../lib/parseEvent'

const TYPES = [
  { key: 'BS',      color: 'bg-teal/10 text-teal border-teal/30' },
  { key: 'Terapia', color: 'bg-purple/10 text-purple border-purple/30' },
  { key: 'Taller',  color: 'bg-orange/10 text-orange border-orange/30' },
]

// Carga eventos de las últimas 5 semanas para detectar pacientes del calendario
async function detectPatientsFromCalendar(accessToken) {
  const now = new Date()
  const timeMin = new Date(now)
  timeMin.setDate(now.getDate() - 35)
  const timeMax = new Date(now)
  timeMax.setDate(now.getDate() + 7)
  const data = await getPrivateEvents(accessToken, timeMin.toISOString(), timeMax.toISOString())
  const events = data.items ?? []
  const seen = new Set()
  return events
    .map((ev) => parseEvent(ev.summary ?? ''))
    .filter((p) => p.patientId && p.patientName && !seen.has(p.patientId) && seen.add(p.patientId))
    .map((p) => ({ id: p.patientId, name: p.patientName }))
}

export function PatientManager({ accessToken }) {
  const [openFormat, setOpenFormat]     = useState(false)
  const [openPatients, setOpenPatients] = useState(false)

  const [patients, setPatients]         = useState([])
  const [loading, setLoading]           = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [edits, setEdits]               = useState({})
  const [saving, setSaving]             = useState(new Set())
  const [saved, setSaved]               = useState(new Set())

  const loadPatients = async () => {
    setLoading(true)
    try {
      const list = await getAllPatients()
      setPatients(list)
      const initial = {}
      list.forEach((p) => {
        initial[p.id] = { fullName: p.fullName ?? '', description: p.description ?? '' }
      })
      setEdits(initial)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const refreshFromCalendar = async () => {
    if (!accessToken) return
    setRefreshing(true)
    try {
      const detected = await detectPatientsFromCalendar(accessToken)
      // Merge: agregar solo los que no están en Firestore
      const existingIds = new Set(patients.map((p) => p.id))
      const newOnes = detected.filter((d) => !existingIds.has(d.id))
      if (newOnes.length > 0) {
        // Guardar en Firestore para que queden registrados
        await Promise.all(newOnes.map((p) =>
          updatePatientInfo(p.id, { fullName: '', description: '' })
        ))
      }
      await loadPatients()
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSave = async (patientId) => {
    setSaving((s) => new Set(s).add(patientId))
    try {
      await updatePatientInfo(patientId, edits[patientId] ?? {})
      setSaved((s) => { const n = new Set(s); n.add(patientId); return n })
      setTimeout(() => setSaved((s) => { const n = new Set(s); n.delete(patientId); return n }), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving((s) => { const n = new Set(s); n.delete(patientId); return n })
    }
  }

  // Ejemplos reales del calendario (max 3)
  const examplePatients = patients.slice(0, 3)

  return (
    <div className="rounded-2xl border border-purple/20 bg-white mb-6 overflow-hidden">
      {/* Sección instrucciones */}
      <button
        onClick={() => setOpenFormat((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition"
      >
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          📋 ¿Cómo agregar sesiones al calendario?
        </span>
        <span className="text-purple">{openFormat ? '▲' : '▼'}</span>
      </button>

      {openFormat && (
        <div className="px-4 pb-5 space-y-4 text-sm font-body text-gray-600 border-t border-purple/10 pt-4">
          <div>
            <p className="font-bold text-gray-800 mb-1">Formato del nombre en Google Calendar:</p>
            <code className="bg-gray-100 rounded-lg px-3 py-2 block text-sm text-gray-700">
              Tipo Nombre del niño
            </code>
            <p className="text-xs text-gray-500 mt-1">El guión es opcional — también funciona <span className="font-mono">BS - Martina</span></p>
          </div>

          <div>
            <p className="font-bold text-gray-800 mb-2">Tipos válidos:</p>
            <div className="space-y-2">
              {TYPES.map(({ key, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{key}</span>
                </div>
              ))}
            </div>
          </div>

          {examplePatients.length > 0 && (
            <div>
              <p className="font-bold text-gray-800 mb-2">Ejemplos con tus pacientes:</p>
              <div className="space-y-1">
                {examplePatients.map((p, i) => {
                  const prefix = ['BS', 'Terapia', 'Taller'][i % 3]
                  return (
                    <p key={p.id} className="font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      {prefix} {p.name}
                    </p>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-orange/10 border border-orange/30 rounded-xl px-3 py-2">
            <p className="text-orange font-bold text-xs">
              ⚠️ El nombre del niño debe ser siempre idéntico para que los reportes lo agrupen correctamente.
            </p>
          </div>
        </div>
      )}

      {/* Sección pacientes */}
      <button
        onClick={() => setOpenPatients((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition border-t border-purple/10"
      >
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          👤 Pacientes registrados
          <span className="text-xs font-normal text-gray-400">({patients.length})</span>
        </span>
        <span className="text-purple">{openPatients ? '▲' : '▼'}</span>
      </button>

      {openPatients && (
        <div className="px-4 pb-5 border-t border-purple/10 pt-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={loadPatients}
              disabled={loading}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-1.5 rounded-full transition disabled:opacity-40"
            >
              {loading ? '⏳' : '🔄'} Refrescar
            </button>
            {accessToken && (
              <button
                onClick={refreshFromCalendar}
                disabled={refreshing}
                className="text-xs bg-purple/10 hover:bg-purple/20 text-purple font-bold px-3 py-1.5 rounded-full transition disabled:opacity-40"
              >
                {refreshing ? '⏳ Leyendo calendario...' : '📅 Sincronizar desde calendario'}
              </button>
            )}
          </div>

          {patients.length === 0 && !loading && (
            <p className="text-gray-400 text-xs text-center py-4">
              Sin pacientes aún — registrá asistencia para que aparezcan aquí
            </p>
          )}

          <div className="space-y-3">
            {patients.map((p) => (
              <div key={p.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-mono mb-2">{p.name}</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={edits[p.id]?.fullName ?? ''}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], fullName: e.target.value } }))}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Descripción (edad, diagnóstico, observaciones...)"
                    value={edits[p.id]?.description ?? ''}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], description: e.target.value } }))}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 bg-white"
                  />
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={saving.has(p.id)}
                    className="self-start text-xs bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-full transition"
                  >
                    {saved.has(p.id) ? '✅ Guardado' : saving.has(p.id) ? '⏳' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
