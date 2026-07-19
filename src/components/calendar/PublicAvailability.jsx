import { useState, useMemo } from 'react'
import { usePublicAvailability } from '../../hooks/useCalendar'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8:00 – 20:00
const DAYS  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_LONG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const today = new Date()

// Devuelve la fecha del lunes de la semana que contiene `date`
function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

// Devuelve array de lunes que tienen al menos un día en el mes indicado
function getWeeksOfMonth(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  // Lunes de la semana del primer día
  const cursor = getMondayOf(firstDay)
  const weeks  = []
  while (cursor <= lastDay) {
    weeks.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

function isBusy(busySlots, dayDate, hour) {
  const slotStart = new Date(dayDate); slotStart.setHours(hour, 0, 0, 0)
  const slotEnd   = new Date(dayDate); slotEnd.setHours(hour + 1, 0, 0, 0)
  return busySlots.some((slot) => {
    const bStart = new Date(slot.start)
    const bEnd   = new Date(slot.end)
    return bStart < slotEnd && bEnd > slotStart
  })
}

function slotKey(date, hour) {
  return `${date.toISOString().slice(0, 10)}_${hour}`
}

function formatSlotLabel(date, hour) {
  const dayName = date.toLocaleDateString('es-CL', { weekday: 'short' })
  const dayNum  = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return `${dayName} ${dayNum} · ${hour}:00 – ${hour + 1}:00`
}

function timeAgo(date) {
  if (!date) return null
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  return mins === 0 ? 'ahora' : `hace ${mins} min`
}

// Devuelve el número de semanas distintas (por ISO week) en los slots seleccionados
function countWeeks(slots) {
  const weeks = new Set(slots.map((s) => s.key.slice(0, 10).slice(0, 7))) // YYYY-MM
  return weeks.size
}

export function PublicAvailability() {
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [weekIdx, setWeekIdx] = useState(() => {
    // Iniciar en la semana actual dentro del mes actual
    const weeks = getWeeksOfMonth(today.getFullYear(), today.getMonth())
    const todayMonday = getMondayOf(today).getTime()
    const idx = weeks.findIndex((w) => w.getTime() === todayMonday)
    return idx >= 0 ? idx : 0
  })

  const [selectedSlots, setSelectedSlots] = useState([])
  const [userName, setUserName]           = useState('')

  const weeks    = useMemo(() => getWeeksOfMonth(year, month), [year, month])
  const weekStart = weeks[Math.min(weekIdx, weeks.length - 1)] ?? getMondayOf(today)

  const { busy, loading, error, refetch, lastUpdated } = usePublicAvailability(weekStart)

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

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
    setWeekIdx(0)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
    setWeekIdx(0)
  }

  const sendWhatsApp = () => {
    const intro = userName.trim() ? `Soy ${userName.trim()}. ` : ''
    const slots = selectedSlots.map((s) => `• ${s.label}`).join('\n')
    const msg   = `Hola Valentina 👋, ${intro}me gustaría consultar disponibilidad para los siguientes horarios:\n\n${slots}\n\n¿Estarías disponible en alguno? ¡Gracias!`
    window.open(`https://wa.me/56962275500?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const weekCount = countWeeks(selectedSlots)

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Header */}
      <div className="bg-purple text-white px-4 py-6 text-center">
        <h1 className="font-heading text-3xl">📅 Disponibilidad</h1>
        <p className="text-purple-light text-sm mt-1">Valentina Pau Roca — Fonoaudióloga</p>
        <p className="text-purple-light/70 text-xs mt-2">Seleccioná los bloques que te interesan y consultá por WhatsApp</p>
      </div>

      {/* Selector de mes */}
      <div className="bg-purple/5 border-b border-purple/10 px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={prevMonth}
            className="flex-shrink-0 text-purple font-bold text-lg px-2 py-0.5 rounded-full hover:bg-purple/10"
          >‹</button>
          <span className="flex-shrink-0 font-bold text-purple text-sm px-1">{year}</span>
          <button
            onClick={nextMonth}
            className="flex-shrink-0 text-purple font-bold text-lg px-2 py-0.5 rounded-full hover:bg-purple/10"
          >›</button>
          <div className="flex gap-1 ml-1">
            {MONTHS_ES.map((m, i) => (
              <button
                key={i}
                onClick={() => { setMonth(i); setWeekIdx(0) }}
                className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full transition whitespace-nowrap ${
                  i === month
                    ? 'bg-purple text-white'
                    : 'text-gray-500 hover:bg-purple/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación semanal */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setWeekIdx((w) => Math.max(0, w - 1))}
            disabled={weekIdx === 0}
            className="text-purple font-bold text-lg px-3 py-1 rounded-full hover:bg-purple/10 disabled:opacity-30"
          >‹</button>
          <div className="text-center">
            <p className="font-bold text-gray-700 text-sm">{weekLabel}</p>
            <p className="text-xs text-gray-400">{MONTHS_LONG[month]} {year}</p>
          </div>
          <button
            onClick={() => setWeekIdx((w) => Math.min(weeks.length - 1, w + 1))}
            disabled={weekIdx >= weeks.length - 1}
            className="text-purple font-bold text-lg px-3 py-1 rounded-full hover:bg-purple/10 disabled:opacity-30"
          >›</button>
        </div>

        {/* Barra de refresh */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-100 text-xs text-gray-400">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1 text-purple hover:text-purple-dark disabled:opacity-40 font-bold transition"
          >
            <span style={{ display: 'inline-block' }} className={loading ? 'animate-spin' : ''}>🔄</span>
            {' '}Actualizar
          </button>
          {lastUpdated && <span>Actualizado {timeAgo(lastUpdated)}</span>}
          {loading && !lastUpdated && <span className="animate-pulse">Cargando...</span>}
        </div>
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
                {days.map(({ label, date, isSunday }) => {
                  const isToday = date.toDateString() === today.toDateString()
                  return (
                    <th key={label} className="text-center px-1 pb-2">
                      <div className={`font-bold ${isToday ? 'text-purple' : isSunday ? 'text-gray-300' : 'text-gray-700'}`}>
                        {label}
                      </div>
                      <div className={`${isToday ? 'bg-purple/10 text-purple rounded-full px-1' : ''} ${isSunday ? 'text-gray-300' : 'text-gray-400'}`}>
                        {formatDate(date)}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="border-t border-gray-100">
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
                          <div className="rounded text-center py-2 bg-gray-100 text-gray-300 cursor-default text-xs" />
                        </td>
                      )
                    }

                    if (occupied) {
                      return (
                        <td key={label} className="px-1 py-0.5">
                          <div className="rounded text-center py-2 font-bold text-xs bg-red-100 text-red-400 cursor-default">
                            ·
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
          <p className="font-bold text-gray-800 text-sm mb-1">
            {selectedSlots.length} bloque{selectedSlots.length > 1 ? 's' : ''} seleccionado{selectedSlots.length > 1 ? 's' : ''}
            {weekCount > 1 && (
              <span className="ml-1.5 text-xs font-normal text-gray-400">· {weekCount} semanas</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mb-3">Podés seleccionar bloques de diferentes semanas antes de consultar.</p>
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
