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

export function PublicAvailability() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = getWeekStart(weekOffset)
  const { busy, loading, error } = usePublicAvailability(weekStart)

  const days = DAYS.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return { label, date: d }
  })

  const shareLink = window.location.href

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    alert('¡Link copiado! Pégalo en WhatsApp 📱')
  }

  const formatDate = (d) =>
    d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })

  const weekLabel = `${formatDate(days[0].date)} – ${formatDate(days[6].date)}`

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Header */}
      <div className="bg-purple text-white px-4 py-6 text-center">
        <h1 className="font-heading text-3xl">📅 Disponibilidad</h1>
        <p className="text-purple-light text-sm mt-1">Valentina Pau Roca — Fonoaudióloga</p>

        <button
          onClick={copyLink}
          className="mt-4 bg-white/20 hover:bg-white/30 text-white text-sm font-bold py-2 px-5 rounded-full transition"
        >
          📤 Compartir por WhatsApp
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          disabled={weekOffset <= 0}
          className="text-purple font-bold text-lg px-3 py-1 rounded-full hover:bg-purple/10 disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-bold text-gray-700 text-sm">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="text-purple font-bold text-lg px-3 py-1 rounded-full hover:bg-purple/10"
        >
          ›
        </button>
      </div>

      {loading && <LoadingSpinner color="text-purple" />}
      {error && (
        <p className="text-center text-red-500 py-8 px-4">
          No se pudo cargar la disponibilidad. Intenta más tarde.
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto px-2 py-4">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="w-12 text-gray-400 font-normal pr-2" />
                {days.map(({ label, date }) => (
                  <th key={label} className="text-center px-1 pb-2">
                    <div className="font-bold text-gray-700">{label}</div>
                    <div className="text-gray-400">{formatDate(date)}</div>
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
                  {days.map(({ label, date }) => {
                    const occupied = isBusy(busy, date, hour)
                    return (
                      <td key={label} className="px-1 py-0.5">
                        <div
                          className={`rounded text-center py-2 font-bold text-xs transition-colors ${
                            occupied
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {occupied ? 'Ocupado' : 'Libre'}
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
      <div className="flex justify-center gap-6 py-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 inline-block" /> Libre
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-200 inline-block" /> Ocupado
        </span>
      </div>

      <p className="text-center text-gray-400 text-xs pb-6 px-4">
        Para agendar escribe al{' '}
        <a href="https://wa.me/56962275500" className="text-green-600 font-bold">
          +56 9 6227 5500
        </a>
      </p>
    </div>
  )
}
