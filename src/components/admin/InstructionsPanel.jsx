import { useState } from 'react'

const TYPES = [
  { key: 'BS',      label: 'Babysitter',  desc: 'Babysitter fonoaudiológico', color: 'bg-teal/10 text-teal border-teal/30' },
  { key: 'Terapia', label: 'Terapia',     desc: 'Terapia fonoaudiológica',    color: 'bg-purple/10 text-purple border-purple/30' },
  { key: 'Taller',  label: 'Taller',      desc: 'Taller educativo',           color: 'bg-orange/10 text-orange border-orange/30' },
]

const EXAMPLES = [
  'BS - Martina López',
  'Terapia - Sebastián Roa',
  'Taller - Emilia Vargas',
]

export function InstructionsPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-purple/20 bg-white mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition"
      >
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          📋 ¿Cómo agregar sesiones al calendario?
        </span>
        <span className="text-purple">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4 text-sm font-body text-gray-600 border-t border-purple/10 pt-4">
          <div>
            <p className="font-bold text-gray-800 mb-1">Formato del nombre en Google Calendar:</p>
            <code className="bg-gray-100 rounded-lg px-3 py-2 block text-sm text-gray-700">
              [Tipo] - [Nombre del niño]
            </code>
          </div>

          <div>
            <p className="font-bold text-gray-800 mb-2">Tipos válidos:</p>
            <div className="space-y-2">
              {TYPES.map(({ key, label, desc, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
                    {key}
                  </span>
                  <span className="text-gray-500">= {desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-bold text-gray-800 mb-2">Ejemplos:</p>
            <div className="space-y-1">
              {EXAMPLES.map((ex) => (
                <p key={ex} className="font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  {ex}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-orange/10 border border-orange/30 rounded-xl px-3 py-2">
            <p className="text-orange font-bold text-xs">
              ⚠️ El nombre del niño debe ser siempre idéntico para que los reportes lo agrupen correctamente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
