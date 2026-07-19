import { useState } from 'react'
import { usePublicAvailability } from '../../hooks/useCalendar'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8:00 – 20:00

function getWeekStart(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function isBusy(busySlots, dayDate, hour) {
  const slotStart = new Date(dayDate)
  slotStart.setHours(hour, 0, 0, 0)
  const slotEnd = new Date(dayDate)
  slotEnd.setHours(hour + 1, 0, 0, 0)
  return busySlots.some((slot) => {
    const busyStart = new Date(slot.start)
    const busyEnd   = new Date(slot.end)
    return busyStart < slotEnd && busyEnd > slotStart
  })
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function slotKey(date, hour) {
  return `${date.toISOString().slice(0, 10)}_${hour}`
}

function formatSlotLabel(date, hour) {
  const dayName = date.toLocaleDateString('es-CL', { weekday: 'short' })
  const dayNum  = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return `${dayName} ${dayNum} · ${hour}:00 – ${hour + 1}:00`
}

export function PublicAvailability() {
  const [weekOffset, setWeekOffset]     = useState(0)
  const [selectedSlots, setSelectedSlots] = useState([])
  const [userName, setUserName]         = useState('')

  const weekStart = getWeekStart(weekOffset)
  const { busy, loading, error } = usePublicAvailability(weekStart)

  const days = DAYS.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return { label, date: d, isSunday: i === 6 }
  })

  const formatDate = (d) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  const weekLabel  = `${formatDate(days[0].date)} – ${formatDate(days[6].date)}`

  const toggleSlot = (date, hour) => {
    const key = slotKey(date, hour)
    setSelectedSlots((prev) =>
      prev.some((s) => s.key === key)
        ? prev.filter((s) => s.key !== key)
        : [...prev, { key, label: formatSlotLabel(date, hour) }]
    )
  }

  const sendWhatsApp = () => {
    const intro = userName.trim() ? `Soy ${userName.trim()}. ` : ''
    const slots = selectedSlots.map((s) => `• ${s.label}`).join('\n')
    const msg   = `Hola Valentina 👋, ${intro}me gustaría consultar disponibilidad para los siguientes horarios:\n\n${slots}\n\n¿Estarías disponible en alguno? ¡Gracias!`
    window.open(`https://wa.me/56962275500?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Header */}
      <div className="bg-purple text-white px-4 py-6 text-center">
        <h1 className="font-heading text-3xl">📅 Disponibilidad</h1>
        <p className="text-purple-light text-sm mt-1">Valentina Pau Roca — Fonoaudióloga</p>
        <p className="text-purple-light/70 text-xs mt-2">Seleccioná los bloques que te interesan y consultá por WhatsApp</p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <button
          onClick={() => { setWeekOffset((w) => w - 1); setSelectedSlots([]) }}
          disabled={weekOffset <= 0}
          className="text-purple font-bold text-lg px-3 py-1 rounded-full hover:bg-purple/10 disabled:opacity-30"
        >‹</button>
        <span className="font-bold text-gray-700 text-sm">{weekLabel}</span>
        <button
          onClick={() => { setWeekOffset((w) => w + 1); setSelectedSlots([]) }}
          className="text-purple font-bold text-lg px-3 py-1 rounded-full hover:bg-purple/10"
        >›</button>
      </div>

      {loading && <LoadingSpinner color="text-purple" />}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          <p className="font-bold mb-1">No se pudo cargar la disponibilidad</p>
          <p className="text-xs text-red-500">{error.message}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto px-2 py-4">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="w-12 text-gray-400 font-normal pr-2" />
                {days.map(({ label, date, isSunday }) => (
                  <th key={label} className="text-center px-1 pb-2">
                    <div className={`font-bold ${isSunday ? 'text-gray-300' : 'text-gray-700'}`}>{label}</div>
                    <div className={isSunday ? 'text-gray-300' : 'text-gray-400'}>{formatDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="text-right pr-2 text-gray-400 whitespace-nowrap py-0.5">
                    {hour}:00
                  </td>
                  {days.map(({ label, date, isSunday }) => {
                    const occupied = isBusy(busy, date, hour)
                    const key      = slotKey(date, hour)
                    const selected = selectedSlots.some((s) => s.key === key)

                    if (isSunday) {
                      return (
                        <td key={label} className="px-1 py-0.5">
                          <div className="rounded text-center py-2 font-bold text-xs bg-gray-100 text-gray-300 cursor-default" />
                        </td>
                      )
                    }

                    if (occupied) {
                      return (
                        <td key={label} className="px-1 py-0.5">
                          <div className="rounded text-center py-2 font-bold text-xs bg-red-100 text-red-400 cursor-default">
                            Ocupado
                          </div>
                        </td>
                      )
                    }

                    return (
                      <td key={label} className="px-1 py-0.5">
                        <div
                          onClick={() => toggleSlot(date, hour)}
                          className={`rounded text-center py-2 font-bold text-xs cursor-pointer transition-colors select-none ${
                            selected
                              ? 'bg-purple text-white shadow-sm'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {selected ? '✓' : 'Libre'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-4 py-3 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 inline-block" /> Libre
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple inline-block" /> Seleccionado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-200 inline-block" /> Ocupado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Dom (no disponible)
        </span>
      </div>

      {/* Panel WhatsApp — aparece cuando hay selección */}
      {selectedSlots.length > 0 && (
        <div className="mx-4 mb-6 bg-white border border-green-200 rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">
            {selectedSlots.length} bloque{selectedSlots.length > 1 ? 's' : ''} seleccionado{selectedSlots.length > 1 ? 's' : ''}
          </p>
          <ul className="space-y-1 mb-4">
            {selectedSlots.map((s) => (
              <li key={s.key} className="text-xs text-gray-600 flex items-center gap-2">
                <span className="text-purple font-bold">•</span> {s.label}
                <button
                  onClick={() => setSelectedSlots((prev) => prev.filter((x) => x.key !== s.key))}
                  className="text-gray-300 hover:text-red-400 ml-auto transition"
                >✕</button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            placeholder="Tu nombre (opcional)"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={sendWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-full transition text-sm flex items-center gap-2"
            >
              💬 Consultar por WhatsApp
            </button>
            <button
              onClick={() => setSelectedSlots([])}
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 rounded-full transition"
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-gray-400 text-xs pb-6 px-4">
        Para agendar escribe al{' '}
        <a href="https://wa.me/56962275500" className="text-green-600 font-bold">
          +56 9 6227 5500
        </a>
      </p>
    </div>
  )
}
