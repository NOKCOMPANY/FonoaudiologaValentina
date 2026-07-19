import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPrivateEvents } from '../../lib/googleCalendar'
import { getSessionsInRange, getAllPatients } from '../../hooks/useFirestore'
import { LoadingSpinner } from '../ui/LoadingSpinner'

function getMonthRange(year, month) {
  const start = new Date(year, month, 1)
  const end   = new Date(year, month + 1, 0, 23, 59, 59)
  return { start, end }
}

function exportCSV(rows, monthLabel) {
  const header = 'Paciente,Agendadas,Asistidas,Ausentes,Porcentaje\n'
  const body   = rows.map((r) =>
    `${r.name},${r.total},${r.attended},${r.absent},${r.pct}%`
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `reporte-${monthLabel}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function MonthlyReport() {
  const { accessToken } = useAuth()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [rows, setRows]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    const { start, end } = getMonthRange(year, month)

    Promise.all([
      getPrivateEvents(accessToken, start.toISOString(), end.toISOString()),
      getSessionsInRange(start, end),
      getAllPatients(),
    ]).then(([calData, sessions, patients]) => {
      const events = calData.items ?? []
      const sessionMap = Object.fromEntries(sessions.map((s) => [s.calendarEventId, s]))
      const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

      // Group by patient
      const byPatient = {}
      events.forEach((ev) => {
        const sess    = sessionMap[ev.id]
        const patId   = sess?.patientId ?? 'sin-registrar'
        const patName = patientMap[patId]?.name ?? ev.summary ?? 'Sin registrar'
        if (!byPatient[patId]) byPatient[patId] = { name: patName, total: 0, attended: 0, absent: 0 }
        byPatient[patId].total++
        if (sess) sess.attended ? byPatient[patId].attended++ : byPatient[patId].absent++
      })

      setRows(
        Object.values(byPatient).map((r) => ({
          ...r,
          pct: r.total > 0 ? Math.round((r.attended / r.total) * 100) : 0,
        }))
      )
    }).finally(() => setLoading(false))
  }, [accessToken, year, month])

  const monthLabel = new Date(year, month).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="font-heading text-3xl text-purple mb-6">Reporte Mensual</h2>

      {/* Month selector */}
      <div className="flex gap-3 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(year, i).toLocaleDateString('es-CL', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
        >
          {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && rows.length === 0 && (
        <p className="text-center text-gray-400 py-8">Sin datos para {monthLabel}</p>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl shadow">
            <table className="w-full text-sm font-body">
              <thead className="bg-purple text-white">
                <tr>
                  {['Paciente', 'Agendadas', 'Asistidas', 'Ausentes', '%'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cream'}>
                    <td className="py-3 px-4 font-bold text-gray-800">{r.name}</td>
                    <td className="py-3 px-4 text-gray-600">{r.total}</td>
                    <td className="py-3 px-4 text-green-600 font-bold">{r.attended}</td>
                    <td className="py-3 px-4 text-red-500 font-bold">{r.absent}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${r.pct >= 80 ? 'text-green-600' : 'text-orange'}`}>
                        {r.pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => exportCSV(rows, monthLabel)}
            className="mt-6 bg-teal hover:bg-teal/80 text-white font-bold py-3 px-6 rounded-full transition"
          >
            📥 Exportar CSV
          </button>
        </>
      )}
    </div>
  )
}
