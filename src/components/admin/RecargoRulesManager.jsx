import { useState } from 'react'
import { saveRecargoRules } from '../../hooks/useFirestore'

const DIAS = [
  { val: 1, label: 'Lunes' },
  { val: 2, label: 'Martes' },
  { val: 3, label: 'Miércoles' },
  { val: 4, label: 'Jueves' },
  { val: 5, label: 'Viernes' },
  { val: 6, label: 'Sábado' },
]

export function RecargoRulesManager({ rules, onSaved }) {
  const [open,     setOpen]    = useState(false)
  const [fdsDia,   setFdsDia]  = useState(rules?.fds?.desdeDia      ?? 5)
  const [fdsHora,  setFdsHora] = useState(rules?.fds?.desdeHora     ?? 20)
  const [fhHora,   setFhHora]  = useState(rules?.fueraDeHorario?.hora ?? 20)
  const [saving,   setSaving]  = useState(false)
  const [saved,    setSaved]   = useState(false)
  const [error,    setError]   = useState(null)

  const diaLabel = DIAS.find((d) => d.val === fdsDia)?.label ?? 'Viernes'
  const diaLabelLower = diaLabel.toLowerCase()

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const newRules = {
        fds:            { desdeDia: fdsDia,  desdeHora: fdsHora },
        fueraDeHorario: { hora: fhHora },
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
            fds desde {diaLabel} {fdsHora}:00 · f.h. desde las {fhHora}:00
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

          <div className="bg-purple/5 border border-purple/15 rounded-xl px-3 py-3 text-xs text-gray-600 space-y-1.5">
            <p className="font-bold text-purple">📋 Cómo funcionan los recargos</p>
            <p>Cada servicio puede tener un monto fijo de recargo por <strong>fin de semana</strong> y/o por <strong>fuera de horario laboral</strong>. El sistema detecta automáticamente el horario del evento en el calendario y suma el extra al precio base.</p>
            <p className="font-bold text-orange mt-1">Regla de prioridad: fin de semana tiene prioridad total.</p>
            <div className="font-mono text-gray-500 space-y-0.5">
              <p>• {diaLabel} ≥ {fdsHora}:00 → recargo <em>fin de semana</em> (no fuera de horario)</p>
              <p>• Sábado y domingo (todo el día) → recargo <em>fin de semana</em></p>
              <p>• Lun–{diaLabelLower} antes de las {fdsHora}:00, a partir de las {fhHora}:00 → <em>fuera de horario</em></p>
              <p>• Eventos de día completo (sin hora) → sin recargo</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-orange mb-2">🟠 Inicio del fin de semana</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Día de inicio</label>
                <select
                  value={fdsDia}
                  onChange={(e) => setFdsDia(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple/30"
                >
                  {DIAS.map((d) => (
                    <option key={d.val} value={d.val}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">A partir de las</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="23" step="1"
                    value={fdsHora}
                    onChange={(e) => setFdsHora(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">:00 hs</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              El fin de semana termina siempre el domingo a las 23:59. Sábado y domingo completos son siempre fin de semana.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-teal mb-2">🕗 Fuera de horario laboral</p>
            <div className="flex items-center gap-3">
              <div className="max-w-44">
                <label className="text-xs font-bold text-gray-500 mb-1 block">A partir de las</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="23" step="1"
                    value={fhHora}
                    onChange={(e) => setFhHora(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">:00 hs</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Aplica de lunes a {diaLabelLower} antes de las {fdsHora}:00 (días que no son fin de semana).
            </p>
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
