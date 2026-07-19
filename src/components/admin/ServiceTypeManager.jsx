import { useState } from 'react'
import { saveServiceType, deleteServiceType } from '../../hooks/useFirestore'

const COLOR_CLASSES = {
  teal:   'bg-teal/10 text-teal border-teal/30',
  purple: 'bg-purple/10 text-purple border-purple/30',
  orange: 'bg-orange/10 text-orange border-orange/30',
  blue:   'bg-blue-100 text-blue-600 border-blue-200',
  pink:   'bg-pink-100 text-pink-600 border-pink-200',
  green:  'bg-green-100 text-green-700 border-green-200',
  gray:   'bg-gray-100 text-gray-500 border-gray-200',
}

const COLOR_DOT = {
  teal:   'bg-teal',
  purple: 'bg-purple',
  orange: 'bg-orange',
  blue:   'bg-blue-500',
  pink:   'bg-pink-400',
  green:  'bg-green-500',
  gray:   'bg-gray-400',
}

const COLORS = Object.keys(COLOR_CLASSES)

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function TypeForm({ initial, onSave, onCancel, saving }) {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '')
  const [aliasInput, setAliasInput]   = useState((initial?.aliases ?? []).join(', '))
  const [color, setColor]             = useState(initial?.color ?? 'gray')
  const [precioHora, setPrecioHora]   = useState(initial?.precioHora ?? '')

  const handleSubmit = () => {
    if (!displayName.trim()) return
    const aliases = aliasInput.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean)
    if (!aliases.length) aliases.push(slugify(displayName))
    const id = initial?.id ?? slugify(displayName)
    onSave(id, { id, displayName: displayName.trim(), aliases, color, order: initial?.order ?? 99, precioHora: Number(precioHora) || 0 })
  }

  return (
    <div className="bg-purple/5 border border-purple/20 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-bold text-purple">{initial ? '✎ Editar tipo' : '+ Nuevo tipo de servicio'}</p>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre del tipo</label>
        <input
          type="text"
          placeholder="Ej: Fonoaudiología"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">
          Alias en el calendario <span className="text-gray-400 font-normal">(separados por coma)</span>
        </label>
        <input
          type="text"
          placeholder="Ej: fono, fonoaudiología"
          value={aliasInput}
          onChange={(e) => setAliasInput(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
        />
        <p className="text-xs text-gray-400 mt-1">La primera palabra del evento en el calendario debe ser uno de estos alias.</p>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">
          Precio por hora <span className="text-gray-400 font-normal">(CLP bruto — opcional)</span>
        </label>
        <input
          type="number"
          min="0"
          step="500"
          placeholder="Ej: 10000"
          value={precioHora}
          onChange={(e) => setPrecioHora(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
        />
        <p className="text-xs text-gray-400 mt-1">
          El reporte calcula el monto según la duración real del evento en Google Calendar.
          Sesión de 30 min = precio ÷ 2 · 1:30 h = precio × 1,5 · Día completo = sin cálculo.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-2 block">Color del badge</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                color === c ? COLOR_CLASSES[c] + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${COLOR_DOT[c]}`} />
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !displayName.trim()}
          className="text-xs bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-full transition"
        >
          {saving ? '⏳' : '💾 Guardar'}
        </button>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-full transition">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function ServiceTypeManager({ serviceTypes, patientTypeCount, unknownTypes, onReload }) {
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState(null)   // null | 'new' | serviceType object
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError]       = useState(null)

  const handleSave = async (id, data) => {
    setSaving(true); setError(null)
    try {
      await saveServiceType(id, data)
      setEditing(null)
      await onReload()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    setDeleting(id); setError(null)
    try {
      await deleteServiceType(id)
      await onReload()
    } catch (e) { setError(e.message) }
    finally { setDeleting(null) }
  }

  const startNewFromUnknown = (typeName) => {
    setEditing({ _prefill: true, displayName: typeName, aliases: [slugify(typeName)], color: 'gray' })
    setOpen(true)
  }

  return (
    <div className="rounded-2xl border border-purple/20 bg-white mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition"
      >
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          🏷️ Tipos de servicio
          <span className="text-xs font-normal text-gray-400">({serviceTypes.length} reglas)</span>
          {unknownTypes.length > 0 && (
            <span className="text-xs font-bold bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
              {unknownTypes.length} sin regla
            </span>
          )}
        </span>
        <span className="text-purple">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-5 border-t border-purple/10 pt-4 space-y-3">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs flex justify-between">
              {error} <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Lista de tipos definidos */}
          <div className="space-y-2">
            {serviceTypes.map((t) => (
              <div key={t.id}>
                {editing?.id === t.id ? (
                  <TypeForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
                ) : (
                  <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full border ${COLOR_CLASSES[t.color] ?? COLOR_CLASSES.gray}`}>
                      {t.displayName}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        alias: <span className="font-mono">{(t.aliases ?? []).join(', ')}</span>
                      </p>
                    </div>
                    {t.precioHora > 0 && (
                      <span className="text-xs text-gray-400 flex-shrink-0 font-mono">
                        ${t.precioHora.toLocaleString('es-CL')}/hr
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {patientTypeCount[t.displayName] ?? 0} pac.
                    </span>
                    <button
                      onClick={() => setEditing({ ...t })}
                      className="flex-shrink-0 text-xs text-purple hover:text-purple-dark font-bold px-2 py-0.5 rounded-full hover:bg-purple/10 transition"
                    >✎</button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="flex-shrink-0 text-xs text-gray-300 hover:text-red-400 font-bold px-1 transition disabled:opacity-40"
                    >
                      {deleting === t.id ? '⏳' : '✕'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formulario nuevo */}
          {editing && (editing === 'new' || editing._prefill) ? (
            <TypeForm
              initial={editing === 'new' ? null : editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
              saving={saving}
            />
          ) : (
            <button
              onClick={() => setEditing('new')}
              className="text-xs bg-purple/10 hover:bg-purple/20 text-purple font-bold px-4 py-1.5 rounded-full transition"
            >
              + Agregar tipo
            </button>
          )}

          {/* Tipos detectados sin regla */}
          {unknownTypes.length > 0 && (
            <div className="mt-2 pt-3 border-t border-gray-100">
              <p className="text-xs font-bold text-amber-600 mb-2">⚠ Detectados en calendario sin regla definida:</p>
              <div className="space-y-1.5">
                {unknownTypes.map(({ typeName, patientCount }) => (
                  <div key={typeName} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-700">"{typeName}"</span>
                      <span className="text-xs text-amber-600 ml-2">— {patientCount} paciente{patientCount !== 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => startNewFromUnknown(typeName)}
                      className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold px-2.5 py-0.5 rounded-full transition"
                    >
                      + Crear regla
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
