import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { getPrivateEvents } from '../../lib/googleCalendar'
import { getSessionsInRange, getAllPatients, saveReport, getReports } from '../../hooks/useFirestore'
import { parseEvent } from '../../lib/parseEvent'
import { TYPE_LABEL } from '../../lib/constants'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const STEPS = ['Obteniendo calendario', 'Obteniendo asistencias', 'Procesando reporte']

const TYPE_BADGE = {
  Taller:     'bg-orange/10 text-orange border-orange/30',
  Babysitter: 'bg-teal/10 text-teal border-teal/30',
  Terapia:    'bg-purple/10 text-purple border-purple/30',
}

function getMonthRange(year, month) {
  const start = new Date(year, month, 1)
  const end   = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function displayType(type) {
  return TYPE_LABEL[type] ?? type ?? '—'
}

// Construye la tabla de pacientes únicos a partir de los eventos del calendario
function buildUniqueRows(events, sessionMap, patientMap) {
  const byPatient = {}

  events.forEach((ev) => {
    const parsed  = parseEvent(ev.summary ?? '')
    const sess    = sessionMap[ev.id]
    const pid     = parsed.patientId || sess?.patientId || 'sin-registrar'
    const type    = parsed.typeName || 'Sin clasificar'   // fuente de verdad = título del evento
    const name    = parsed.patientName || patientMap[pid]?.name || ev.summary || 'Sin registrar'

    if (!byPatient[pid]) {
      byPatient[pid] = { patientName: name, types: new Set(), total: 0, attended: 0, absent: 0 }
    }
    byPatient[pid].types.add(type)
    byPatient[pid].total++
    if (sess?.attended !== undefined) {
      sess.attended ? byPatient[pid].attended++ : byPatient[pid].absent++
    }
  })

  return Object.values(byPatient).map((r) => ({
    patientName: r.patientName,
    types: [...r.types],
    total: r.total,
    attended: r.attended,
    absent: r.absent,
    pct: r.total > 0 ? Math.round((r.attended / r.total) * 100) : 0,
  }))
}

function exportCSV(rows, name) {
  const header = 'Paciente,Servicios,Agendadas,Asistidas,Ausentes,Porcentaje\n'
  const body   = rows.map((r) =>
    `"${r.patientName}","${r.types.map(displayType).join(' / ')}",${r.total},${r.attended},${r.absent},${r.pct}%`
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `reporte-${name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(rows, name) {
  const doc    = new jsPDF()
  const purple = [124, 58, 237]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...purple)
  doc.text('Reporte de Asistencia', 14, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(name, 14, 28)
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    14, 34
  )

  autoTable(doc, {
    startY: 42,
    head: [['Paciente', 'Servicios', 'Agendadas', 'Asistidas', 'Ausentes', '%']],
    body: rows.map((r) => [
      r.patientName,
      r.types.map(displayType).join('\n'),
      r.total,
      r.attended,
      r.absent,
      `${r.pct}%`,
    ]),
    headStyles: { fillColor: purple, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [253, 248, 240] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 1: { cellWidth: 55 } },
  })

  doc.save(`reporte-${name}.pdf`)
}

function ReportTable({ report }) {
  const { uniqueRows = [], customName, name } = report
  const displayName = customName || name

  if (uniqueRows.length === 0) {
    return <p className="text-gray-400 py-4 text-center">Sin eventos en este período</p>
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl shadow mb-4">
        <table className="w-full text-sm font-body">
          <thead className="bg-purple text-white">
            <tr>
              {['Paciente', 'Servicios', 'Agendadas', 'Asistidas', 'Ausentes', '%'].map((h) => (
                <th key={h} className="py-3 px-4 text-left font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueRows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cream'}>
                <td className="py-3 px-4 font-bold text-gray-800 whitespace-nowrap">{r.patientName}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {r.types.map((t) => (
                      <span
                        key={t}
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TYPE_BADGE[t] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}
                      >
                        {displayType(t)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600 text-center">{r.total}</td>
                <td className="py-3 px-4 text-green-600 font-bold text-center">{r.attended}</td>
                <td className="py-3 px-4 text-red-500 font-bold text-center">{r.absent}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`font-bold ${r.pct >= 80 ? 'text-green-600' : 'text-orange'}`}>
                    {r.pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => exportCSV(uniqueRows, displayName)}
          className="bg-teal hover:bg-teal/80 text-white font-bold py-2.5 px-5 rounded-full transition text-sm"
        >
          📥 Exportar CSV
        </button>
        <button
          onClick={() => exportPDF(uniqueRows, displayName)}
          className="bg-purple hover:bg-purple/80 text-white font-bold py-2.5 px-5 rounded-full transition text-sm"
        >
          📄 Exportar PDF
        </button>
      </div>
    </div>
  )
}

export function MonthlyReport() {
  const { accessToken } = useAuth()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [step, setStep]         = useState(0)
  const [genError, setGenError] = useState(null)

  const [pendingReport, setPendingReport] = useState(null)
  const [reportName, setReportName]       = useState('')
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState(null)

  const [activeReport, setActiveReport] = useState(null)
  const [savedReports, setSavedReports] = useState([])
  const [loadingList, setLoadingList]   = useState(true)
  const [filter, setFilter]             = useState('')

  useEffect(() => {
    getReports()
      .then(setSavedReports)
      .catch(() => setSavedReports([]))
      .finally(() => setLoadingList(false))
  }, [])

  const monthLabel = new Date(year, month).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  const handleGenerate = async () => {
    if (!accessToken) return
    setGenError(null)
    setPendingReport(null)
    setStep(1)
    try {
      const { start, end } = getMonthRange(year, month)

      const calData = await getPrivateEvents(accessToken, start.toISOString(), end.toISOString())
      setStep(2)

      const [sessions, patients] = await Promise.all([
        getSessionsInRange(start, end).catch(() => []),
        getAllPatients().catch(() => []),
      ])
      setStep(3)

      const events     = calData.items ?? []
      const sessionMap = Object.fromEntries(sessions.map((s) => [s.calendarEventId, s]))
      const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

      const uniqueRows = buildUniqueRows(events, sessionMap, patientMap)

      setPendingReport({ name: monthLabel, month, year, uniqueRows })
      setReportName(monthLabel)
    } catch (err) {
      setGenError(err.message ?? 'Error al generar reporte')
    } finally {
      setStep(0)
    }
  }

  const handleSave = async () => {
    if (!pendingReport || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const customName = reportName.trim() || monthLabel
      await saveReport({ ...pendingReport, customName })
      const updated = await getReports()
      setSavedReports(updated)
      setPendingReport(null)
      setReportName('')
    } catch (err) {
      setSaveError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const isGenerating = step > 0

  const filteredReports = filter.trim()
    ? savedReports.filter((r) =>
        r.uniqueRows?.some((row) => row.patientName?.toLowerCase().includes(filter.toLowerCase()))
      )
    : savedReports

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="font-heading text-3xl text-purple mb-6">Reporte Mensual</h2>

      <div className="flex gap-3 mb-4 flex-wrap items-center">
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
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !accessToken}
          className="bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-6 py-2 rounded-full transition"
        >
          {isGenerating ? 'Generando...' : '⚡ Generar reporte'}
        </button>
      </div>

      {isGenerating && (
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            {STEPS.map((s, i) => (
              <span key={i} className={i < step ? 'text-purple font-bold' : i === step - 1 ? 'text-purple' : ''}>
                {i < step ? '✓ ' : ''}{s}
              </span>
            ))}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {genError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm font-mono">
          {genError}
        </div>
      )}

      {pendingReport && !isGenerating && (
        <div className="mb-8 bg-white rounded-2xl border border-purple/20 p-4 shadow-sm">
          <h3 className="font-heading text-xl text-purple mb-1">Vista previa — {pendingReport.name}</h3>
          <p className="text-xs text-gray-400 mb-4">{pendingReport.uniqueRows?.length ?? 0} paciente(s)</p>
          <ReportTable report={pendingReport} />

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 font-bold mb-2">Nombre del reporte</p>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Ej: Julio 2026 primera quincena"
                className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-5 py-2 rounded-full transition text-sm"
              >
                {saving ? 'Guardando...' : '💾 Guardar reporte'}
              </button>
            </div>
            {saveError && (
              <p className="mt-2 text-red-500 text-xs font-mono">{saveError}</p>
            )}
          </div>
        </div>
      )}

      <hr className="my-6 border-gray-200" />

      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h3 className="font-heading text-xl text-gray-700">Historial de reportes</h3>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="🔍 Filtrar por paciente..."
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
          />
        </div>

        {loadingList && <LoadingSpinner />}

        {!loadingList && filteredReports.length === 0 && (
          <p className="text-gray-400 text-sm py-4 text-center">
            {filter ? 'Sin reportes que coincidan' : 'Aún no hay reportes guardados'}
          </p>
        )}

        <div className="space-y-2">
          {filteredReports.map((r) => (
            <div key={r.id}>
              <button
                onClick={() => setActiveReport(activeReport?.id === r.id ? null : r)}
                className={`w-full text-left border rounded-2xl px-4 py-3 transition flex items-center justify-between ${
                  activeReport?.id === r.id
                    ? 'bg-purple/5 border-purple/30'
                    : 'bg-white hover:bg-purple/5 border-gray-200'
                }`}
              >
                <div>
                  <p className="font-bold text-gray-800 text-sm capitalize">{r.customName || r.name}</p>
                  <p className="text-xs text-gray-400">
                    {r.uniqueRows?.length ?? 0} paciente(s) ·{' '}
                    {r.generatedAt?.toDate
                      ? r.generatedAt.toDate().toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                      : ''}
                  </p>
                </div>
                <span className="text-purple text-xs font-bold">
                  {activeReport?.id === r.id ? '▲ Cerrar' : 'Ver →'}
                </span>
              </button>

              {activeReport?.id === r.id && (
                <div className="mt-2 bg-white rounded-2xl border border-purple/20 p-4">
                  <ReportTable report={r} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
