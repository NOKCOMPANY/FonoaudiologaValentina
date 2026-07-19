import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { markAttendance, upsertPatient } from '../../hooks/useFirestore'

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function AttendanceTracker() {
  const [params] = useSearchParams()
  const eventId  = params.get('eventId') ?? ''
  const name     = params.get('name') ?? ''
  const patientId = slugify(name)

  const [attended, setAttended] = useState(null)
  const [notes, setNotes]       = useState('')
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (attended === null || !eventId) return
    setSaving(true)
    await upsertPatient(patientId, { name })
    await markAttendance(eventId, patientId, attended, notes)
    setSaving(false)
    setSaved(true)
  }

  if (!eventId) {
    return (
      <p className="text-gray-500 text-center py-8">
        Accede desde el panel de sesiones del día.
      </p>
    )
  }

  if (saved) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">✅</span>
        <h2 className="font-heading text-2xl text-purple mt-4">Asistencia guardada</h2>
        <p className="text-gray-500 mt-2">{name} — {attended ? 'Asistió' : 'No asistió'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <h2 className="font-heading text-3xl text-purple mb-2">Registro de Asistencia</h2>
      <p className="font-body text-gray-600 mb-6">Paciente: <strong>{name || 'Sin nombre'}</strong></p>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setAttended(true)}
          className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${
            attended === true
              ? 'bg-green-500 text-white shadow-lg scale-105'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          ✅ Asistió
        </button>
        <button
          onClick={() => setAttended(false)}
          className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${
            attended === false
              ? 'bg-red-400 text-white shadow-lg scale-105'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          }`}
        >
          ❌ No asistió
        </button>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas de la sesión (opcional)..."
        className="w-full border border-gray-200 rounded-2xl p-4 text-sm font-body resize-none h-28 focus:outline-none focus:ring-2 focus:ring-purple/30"
      />

      <button
        onClick={handleSave}
        disabled={attended === null || saving}
        className="w-full mt-4 bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition"
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  )
}
