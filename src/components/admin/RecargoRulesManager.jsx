import { useState } from 'react'
import { saveRecargoRules } from '../../hooks/useFirestore'

const DIAS = [
  { val: 0, label: 'Domingo' },
  { val: 1, label: 'Lunes' },
  { val: 2, label: 'Martes' },
  { val: 3, label: 'Miércoles' },
  { val: 4, label: 'Jueves' },
  { val: 5, label: 'Viernes' },
  { val: 6, label: 'Sábado' },
]

function HoraInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number" min="0" max="23" step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 border border-gray-200 rounded-xl px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple/30"
      />
      <span className="text-xs text-gray-500">:00 hs</span>
    </div>
  )
}

export function RecargoRulesManager({ rules, onSaved }) {
  const [open,          setOpen]         = useState(false)
  // Fin de semana
  const [fdsDia,        setFdsDia]       = useState(rules?.fds?.desdeDia   ?? 5)
  const [fdsHora,       setFdsHora]      = useState(rules?.fds?.desdeHora  ?? 20)
  const [fdsHastaDia,   setFdsHastaDia]  = useState(rules?.fds?.hastaDia   ?? 0)
  const [fdsHastaHora,  setFdsHastaHora] = useState(rules?.fds?.hastaHora  ?? 23)
  // Fuera de horario (días fijo: lunes–jueves)
  const [fhHora,        setFhHora]       = useState(rules?.fueraDeHorario?.hora      ?? 20)
  const [fhHastaHora,   setFhHastaHora]  = useState(rules?.fueraDeHorario?.hastaHora ?? 23)

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState(null)

  const diaLabel      = DIAS.find((d) => d.val === fdsDia)?.label      ?? 'Viernes'
  const hastaDiaLabel = DIAS.find((d) => d.val === fdsHastaDia)?.label ?? 'Domingo'

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const newRules = {
        fds:            { desdeDia: fdsDia, desdeHora: fdsHora, hastaDia: fdsHastaDia, hastaHora: fdsHastaHora },
        fueraDeHorario: { hora: fhHora, hastaHora: fhHastaHora },
      }
      await saveRecargoRules(newRules)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      if (onSaved) onSaved(newRules)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl border border-purple/20 bg-white mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition"
      >
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          ⚙️ Reglas de recargo por horario
          <span className="text-xs font-normal text-gray-400">
            fds {diaLabel} {fdsHora}:00 → {hastaDiaLabel} {fdsHastaHora}:59 · f.h. {fhHora}:00–{fhHastaHora}:59 lun–jue
          </span>
        </span>
        <span className="text-purple">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-5 border-t border-purple/10 pt-4 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs flex justify-between">
              {error} <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Explicación */}
          <div className="bg-purple/5 border border-purple/15 rounded-xl px-3 py-3 text-xs text-gray-600 space-y-1.5">
            <p className="font-bold text-purple">📋 Cómo funcionan los recargos</p>
            <p>Cada servicio puede tener un monto fijo de recargo por <strong>fin de semana</strong> y/o por <strong>fuera de horario</strong>. El sistema detecta automáticamente el horario del evento en el calendario y suma el extra al precio base.</p>
            <p className="font-bold text-orange mt-1">Regla de prioridad: fin de semana tiene prioridad total.</p>
            <div className="font-mono text-gray-500 space-y-0.5 mt-1">
              <p>• {diaLabel} {fdsHora}:00 → {hastaDiaLabel} {fdsHastaHora}:59 → recargo <em>fin de semana</em></p>
              <p>• Lun–Jue {fhHora}:00–{fhHastaHora}:59 → recargo <em>fuera de horario</em></p>
              <p>• Viernes antes de las {fdsHora}:00 → horario normal (sin recargo)</p>
              <p>• Eventos de día completo (sin hora) → sin recargo</p>
            </div>
          </div>

          {/* ── Fin de semana ── */}
          <div>
            <p className="text-xs font-bold text-orange mb-3">🟠 Fin de semana</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Desde — día</label>
                <select
                  value={fdsDia}
                  onChange={(e) => setFdsDia(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple/30"
                >
                  {DIAS.map((d) => <option key={d.val} value={d.val}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Desde — hora</label>
                <HoraInput value={fdsHora} onChange={setFdsHora} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta — día</label>
                <select
                  value={fdsHastaDia}
                  onChange={(e) => setFdsHastaDia(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple/30"
                >
                  {DIAS.map((d) => <option key={d.val} value={d.val}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta — hora</label>
                <HoraInput value={fdsHastaHora} onChange={setFdsHastaHora} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Días intermedios entre inicio y fin se consideran fin de semana completo.
            </p>
          </div>

          {/* ── Fuera de horario ── */}
          <div>
            <p className="text-xs font-bold text-teal mb-1">🕗 Fuera de horario</p>
            <p className="text-xs text-gray-400 mb-3">
              Aplica únicamente <strong>lunes a jueves</strong> (fijo, no configurable). Viernes no aplica — queda cubierto por la regla de fin de semana.
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Desde — hora</label>
                <HoraInput value={fhHora} onChange={setFhHora} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Hasta — hora</label>
                <HoraInput value={fhHastaHora} onChange={setFhHastaHora} />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-full transition"
          >
            {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar reglas'}
          </button>
        </div>
      )}
    </div>
  )
}
