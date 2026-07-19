import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { getPrivateEvents } from '../../lib/googleCalendar'
import { getSessionsInRange, getAllPatients, getServiceTypes, getRecargoRules } from '../../hooks/useFirestore'
import { parseEvent } from '../../lib/parseEvent'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { colorVariant, COLORS } from '../../lib/colorMaps'
import { calcRecargo, DEFAULT_RECARGO_RULES } from '../../lib/recargoRules'

// ── Datos profesionales para membrete PDF ─────────────────────────────────────
const PROF_INFO = {
  name:       'Valentina Pau Roca',
  title:      'Fonoaudióloga',
  university: 'Universidad de Chile',
  email:      'valentinapauroca0@gmail.com',
  phone:      '+56 9 6227 5500',
}

// ── Helpers de formato ────────────────────────────────────────────────────────
function calcDuration(startISO, endISO) {
  if (!startISO || !endISO || !startISO.includes('T') || !endISO.includes('T')) return undefined
  return (new Date(endISO) - new Date(startISO)) / 3_600_000
}

function formatCLP(n) {
  if (n === undefined || n === null || n === 0) return '—'
  return `$${Math.round(n).toLocaleString('es-CL')}`
}

function formatHours(h) {
  if (h === undefined || h === null || h === 0) return '—'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h % 1 === 0) return `${h} h`
  return `${h.toFixed(1)} h`
}

// ── Helper de precio por sesión (soporta modo 'hora' y 'fijo') ───────────────
//
// Modo 'hora': precio = durHours × precioHora  (proporcional a duración real)
// Modo 'fijo': precio = (durHours / horasRef) × precioFijo
//   → horasRef es el bloque de referencia definido en el tipo de servicio
//   → si el evento dura el doble del bloque = se cobran dos bloques
//   → ejemplo: precioFijo=$30.000, horasRef=3h, evento 4h → $40.000
function calcPrecioSesion(st, durHours) {
  if (!st) return undefined
  if (st.tipoPrecio === 'fijo') {
    if (!(st.precioFijo > 0) || !(st.horasRef > 0) || durHours === undefined) return undefined
    return (durHours / st.horasRef) * st.precioFijo
  }
  // 'hora' (default cuando tipoPrecio no existe — retrocompatibilidad)
  if (durHours === undefined || !(st.precioHora > 0)) return undefined
  return durHours * st.precioHora
}

// ── Helpers dinámicos desde serviceTypes (usa colorMaps centralizado) ─────────
function makeHelpers(serviceTypes) {
  const colorOf  = (name) => serviceTypes.find((s) => s.displayName === name)?.color ?? 'gray'
  const textOf   = (name) => colorVariant(colorOf(name), 'text')
  const barOf    = (name) => colorVariant(colorOf(name), 'bar')
  const pdfOf    = (name) => colorVariant(colorOf(name), 'rgb')
  const shortOf  = (name) => {
    const st = serviceTypes.find((s) => s.displayName === name)
    if (st?.aliases?.[0]) return st.aliases[0].toUpperCase().slice(0, 4)
    return name.slice(0, 5)
  }
  return { colorOf, textOf, barOf, pdfOf, shortOf }
}

// ── Construcción de filas ─────────────────────────────────────────────────────
function buildUniqueRows(events, sessionMap, patientMap, serviceTypes, recargoRules) {
  const byPatient = {}

  events.forEach((ev) => {
    const parsed      = parseEvent(ev.summary ?? '')
    const sess        = sessionMap[ev.id]
    const pid         = parsed.patientId || sess?.patientId || 'sin-registrar'
    const type        = sess?.type || parsed.typeName || 'Sin clasificar'
    const name        = parsed.patientName || patientMap[pid]?.name || ev.summary || 'Sin registrar'
    const fullName    = patientMap[pid]?.fullName || null
    const description = patientMap[pid]?.description || null

    const durHours   = calcDuration(ev.start?.dateTime, ev.end?.dateTime)
    const st         = serviceTypes.find((s) => s.displayName === type)
    const precioBase = calcPrecioSesion(st, durHours)
    const recargo    = calcRecargo(ev.start?.dateTime, st, recargoRules, durHours)
    const precio     = precioBase !== undefined
      ? precioBase + recargo.total
      : (recargo.total > 0 ? recargo.total : undefined)

    if (!byPatient[pid]) {
      byPatient[pid] = {
        patientName: name, fullName, description,
        total: 0, attended: 0, absent: 0,
        typeCounts: {},
        sessions: [],
      }
    }

    byPatient[pid].sessions.push({
      startDateTime: ev.start?.dateTime ?? ev.start?.date,
      endDateTime:   ev.end?.dateTime   ?? ev.end?.date,
      type, attended: sess?.attended, notes: sess?.notes ?? '',
      durHours, precio, precioBase,
      recargoFds:   recargo.montoFds,
      recargoFuera: recargo.montoFuera,
      esFds:        recargo.esFds,
      esFuera:      recargo.esFuera,
    })

    byPatient[pid].total++
    if (!byPatient[pid].typeCounts[type]) {
      byPatient[pid].typeCounts[type] = { total: 0, attended: 0, absent: 0, horasAgendadas: 0, montoAgendado: 0, montoAsistido: 0 }
    }
    const tc = byPatient[pid].typeCounts[type]
    tc.total++

    if (sess?.attended !== undefined) {
      sess.attended ? byPatient[pid].attended++ : byPatient[pid].absent++
      sess.attended ? tc.attended++ : tc.absent++
    }
    if (durHours !== undefined) {
      tc.horasAgendadas += durHours
      if (precio !== undefined) {
        tc.montoAgendado += precio
        if (sess?.attended) tc.montoAsistido += precio
      }
    }
  })

  return Object.values(byPatient)
    .map((r) => ({
      patientName:   r.fullName || r.patientName,
      rawName:       r.patientName,
      description:   r.description,
      total:         r.total,
      attended:      r.attended,
      absent:        r.absent,
      pct:           r.total > 0 ? Math.round((r.attended / r.total) * 100) : 0,
      typeCounts:    r.typeCounts,
      montoTotal:    Object.values(r.typeCounts).reduce((a, tc) => a + tc.montoAgendado, 0),
      montoAsistido: Object.values(r.typeCounts).reduce((a, tc) => a + tc.montoAsistido, 0),
      sessions:      r.sessions.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)),
    }))
    .sort((a, b) => a.patientName.localeCompare(b.patientName, 'es'))
}

// ── Logo SII — carga el SVG de /public y lo convierte a PNG para jsPDF ───────
function loadSiiLogoPng(w = 80, h = 68) {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = w * 3
        canvas.height = h * 3
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = '/sii-logo.svg'
  })
}

// ── Membrete jsPDF ────────────────────────────────────────────────────────────
function drawHeader(doc, y = 14) {
  const purple = [124, 58, 237]
  const gray   = [100, 100, 100]

  // Rectángulo de fondo claro
  doc.setFillColor(245, 240, 255)
  doc.rect(14, y - 4, 182, 20, 'F')
  // Borde izquierdo morado
  doc.setFillColor(...purple)
  doc.rect(14, y - 4, 3, 20, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...purple)
  doc.text(`${PROF_INFO.name} — ${PROF_INFO.title}`, 21, y + 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...gray)
  doc.text(PROF_INFO.university, 21, y + 7)
  doc.text(`${PROF_INFO.email}   |   WhatsApp: ${PROF_INFO.phone}`, 21, y + 12)

  return y + 24
}

// ── PDF individual paciente ───────────────────────────────────────────────────
async function exportPatientPDF(row, reportName, recargoRules) {
  const siiLogoPng = await loadSiiLogoPng(400, 340)
  const doc    = new jsPDF()
  // Paleta suave morada — femenina, sin negros duros
  const purple = [109, 40, 217]   // purple-700 — acento principal
  const purpleL = [124, 58, 237]  // purple-600 — headers de tabla
  const GRAY   = [110, 110, 120]  // gris cálido para textos secundarios
  let y = 14

  y = drawHeader(doc, y)

  // ── Título + período ──────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...purple)
  doc.text('INFORME DE ATENCIONES FONOAUDIOLÓGICAS', 14, y); y += 6
  if (reportName) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text(`Período: ${reportName}`, 14, y)
    doc.text(`Emitido: ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`, 196, y, { align: 'right' })
    y += 5
  }

  // ── Nombre del paciente ───────────────────────────────────────────────────
  doc.setDrawColor(210, 190, 245)
  doc.setLineWidth(0.3)
  doc.line(14, y + 2, 196, y + 2)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(50, 20, 80)
  doc.text(row.patientName, 14, y + 5)
  if (row.description) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(...GRAY)
    doc.text(row.description, 14, y + 10)
    y += 14
  } else {
    y += 9
  }
  doc.setDrawColor(210, 190, 245)
  doc.line(14, y + 1, 196, y + 1)
  y += 7

  // ── Separador sección resumen ─────────────────────────────────────────────
  doc.setFillColor(...purpleL)
  doc.rect(14, y, 4, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...purpleL)
  doc.text('Resumen por tipo de servicio', 21, y + 4)
  doc.setDrawColor(200, 180, 245)
  doc.setLineWidth(0.2)
  doc.line(14, y + 6, 196, y + 6)
  y += 10

  // ── Tabla resumen ─────────────────────────────────────────────────────────
  const typeEntries = Object.entries(row.typeCounts).filter(([, tc]) => tc.total > 0)

  const serviceRows = typeEntries.map(([type, tc]) => [
    type,
    tc.total,
    tc.attended,
    tc.absent,
    tc.montoAgendado > 0 ? formatCLP(tc.montoAgendado) : '—',
  ])
  serviceRows.push([
    'TOTAL',
    row.total,
    row.attended,
    row.absent,
    row.montoTotal > 0 ? formatCLP(row.montoTotal) : '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Servicio', 'Agendadas', 'Completadas', 'No efectuadas', 'Monto Bruto']],
    body: serviceRows,
    headStyles: { fillColor: purpleL, fontStyle: 'bold', fontSize: 9, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 247, 255] },
    styles: { fontSize: 9, cellPadding: 3.5, textColor: [50, 30, 70] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center', textColor: [22, 163, 74] },
      3: { halign: 'center', textColor: [180, 40, 40] },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === serviceRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [230, 218, 255]
        data.cell.styles.textColor = [70, 20, 160]
      }
    },
  })
  y = doc.lastAutoTable.finalY + 5

  // ── Nota "No efectuada" — caja info centrada con icono circular ──────────
  const noteH  = 20
  const noteY  = y
  doc.setFillColor(248, 245, 255)
  doc.setDrawColor(210, 190, 245)
  doc.setLineWidth(0.25)
  doc.roundedRect(14, noteY, 182, noteH, 3, 3, 'FD')
  // barra izquierda
  doc.setFillColor(167, 139, 250)
  doc.roundedRect(14, noteY, 3, noteH, 1.5, 1.5, 'F')
  // icono circular info centrado verticalmente
  const iconCX = 25
  const iconCY = noteY + noteH / 2
  doc.setFillColor(167, 139, 250)
  doc.circle(iconCX, iconCY, 3.8, 'F')
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('i', iconCX, iconCY + 1.2, { align: 'center' })
  // texto centrado verticalmente
  const textX  = 33
  const line1Y = noteY + noteH / 2 - 3.5
  const line2Y = noteY + noteH / 2 + 1.5
  const line3Y = noteY + noteH / 2 + 5.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(110, 85, 150)
  doc.text('Agenda no efectuada:', textX, line1Y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  doc.setTextColor(130, 110, 160)
  doc.text('Sesion registrada en el calendario que no pudo realizarse (inasistencia, cancelacion o', textX, line2Y)
  doc.text('reprogramacion). Queda registrada para trazabilidad pero no genera cobro adicional.', textX, line3Y)
  y += noteH + 6

  // ── Separador sección detalle ─────────────────────────────────────────────
  doc.setFillColor(...purpleL)
  doc.rect(14, y, 4, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...purpleL)
  doc.text('Detalle de sesiones', 21, y + 4)
  doc.setDrawColor(200, 180, 245)
  doc.setLineWidth(0.2)
  doc.line(14, y + 6, 196, y + 6)
  y += 10

  // ── Tabla de detalle consolidada ──────────────────────────────────────────
  const byDay = {}
  ;(row.sessions ?? []).forEach((s) => {
    if (!s.startDateTime?.includes('T')) return
    const d   = new Date(s.startDateTime)
    const key = d.toISOString().slice(0, 10)
    if (!byDay[key]) {
      byDay[key] = {
        label: d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }),
        sessions: [],
      }
    }
    byDay[key].sessions.push(s)
  })

  const dayKeys = Object.keys(byDay).sort()

  if (dayKeys.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text('Sin sesiones con horario definido en este periodo.', 14, y)
    y += 8
  } else {
    const allRows         = []
    const subtotalRowIdxs = []
    const dayHeaderIdxs   = []

    dayKeys.forEach((key) => {
      const { label, sessions: daySessions } = byDay[key]
      const dayMonto = daySessions.reduce((a, s) => a + (s.precio ?? 0), 0)
      const capLabel = label.charAt(0).toUpperCase() + label.slice(1)

      daySessions.forEach((s, idx) => {
        const ini    = new Date(s.startDateTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        const fin    = s.endDateTime?.includes('T')
          ? new Date(s.endDateTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
          : '--'
        const estado = s.attended === true  ? 'Completado'
                     : s.attended === false ? 'No efectuada'
                     : 'Sin registrar'
        if (idx === 0) dayHeaderIdxs.push(allRows.length)
        allRows.push([idx === 0 ? capLabel : '', `${ini}-${fin}`, s.type, estado,
                      s.precio !== undefined ? formatCLP(s.precio) : '--'])
      })

      subtotalRowIdxs.push(allRows.length)
      allRows.push(['', 'Subtotal', '', '', dayMonto > 0 ? formatCLP(dayMonto) : '--'])
    })

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Horario', 'Tipo', 'Estado', 'Monto']],
      body: allRows,
      headStyles: { fillColor: purpleL, fontStyle: 'bold', fontSize: 9, textColor: [255, 255, 255] },
      alternateRowStyles: {},
      styles: { fontSize: 8.5, cellPadding: 2.8, textColor: [50, 30, 70] },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', textColor: [80, 40, 120] },
        1: { cellWidth: 27 },
        2: { cellWidth: 28 },
        3: { cellWidth: 51 },
        4: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return
        const idx = data.row.index
        if (subtotalRowIdxs.includes(idx)) {
          data.cell.styles.fillColor = [235, 228, 255]
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [80, 40, 160]
        } else if (dayHeaderIdxs.includes(idx)) {
          data.cell.styles.fillColor = [249, 246, 255]
        }
        if (data.column.index === 3 && !subtotalRowIdxs.includes(idx)) {
          const val = data.cell.raw
          if (val === 'Completado')   data.cell.styles.textColor = [22, 163, 74]
          else if (val === 'No efectuada') data.cell.styles.textColor = [200, 40, 40]
          else                        data.cell.styles.textColor = [160, 150, 170]
        }
      },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Glosa SII compacta ────────────────────────────────────────────────────
  if (y + 16 > 280) { doc.addPage(); y = 20 }

  doc.setFillColor(245, 245, 250)
  doc.setDrawColor(180, 180, 210)
  doc.setLineWidth(0.2)
  doc.roundedRect(14, y - 2, 182, 13, 2, 2, 'FD')

  const logoW = 9; const logoH = Math.round(logoW * 340 / 400)
  if (siiLogoPng) {
    doc.addImage(siiLogoPng, 'PNG', 18, y - 0.5, logoW, logoH)
  } else {
    doc.setFillColor(0, 97, 160)
    doc.roundedRect(18, y, 9, 7, 1, 1, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255)
    doc.text('SII', 19.5, y + 4.5)
  }

  const siiTextX = 18 + logoW + 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(50, 50, 80)
  doc.text('INFORMACIÓN TRIBUTARIA', siiTextX, y + 2.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 100)
  doc.text(`Se emitirá Boleta de Honorarios Electrónica por ${formatCLP(row.montoTotal)} (monto bruto).`, siiTextX, y + 8)
  y += 16

  doc.save(`informe-${row.patientName.replace(/\s+/g, '-').toLowerCase()}-${reportName?.replace(/\s+/g, '-') ?? 'reporte'}.pdf`)
}

// ── CSV individual ────────────────────────────────────────────────────────────
function exportPatientCSV(row) {
  const lines = ['Servicio,Precio/hr,Horas,Agendadas,Asistidas,Ausentes,Monto Bruto']
  Object.entries(row.typeCounts).forEach(([type, tc]) => {
    if (tc.total > 0) {
      lines.push(`"${type}",${tc.montoAgendado > 0 ? tc.montoAgendado / (tc.horasAgendadas || 1) : ''},${tc.horasAgendadas.toFixed(2)},${tc.total},${tc.attended},${tc.absent},${tc.montoAgendado}`)
    }
  })
  lines.push(`Total,,${Object.values(row.typeCounts).reduce((a, tc) => a + tc.horasAgendadas, 0).toFixed(2)},${row.total},${row.attended},${row.absent},${row.montoTotal}`)
  lines.push('')
  lines.push('Fecha,Hora ini.,Hora fin,Duración,Tipo,Precio sesión,Estado,Nota')
  ;(row.sessions ?? []).forEach((s) => {
    const start  = s.startDateTime?.includes('T') ? new Date(s.startDateTime) : null
    const end    = s.endDateTime?.includes('T')   ? new Date(s.endDateTime)   : null
    const fecha  = start ? start.toLocaleDateString('es-CL') : '—'
    const ini    = start ? start.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '—'
    const fin    = end   ? end.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })   : '—'
    const dur    = s.durHours !== undefined ? s.durHours.toFixed(2) : ''
    const estado = s.attended === true ? 'Asistió' : s.attended === false ? 'No asistió' : 'Sin registrar'
    lines.push(`"${fecha}","${ini}","${fin}","${dur}","${s.type}",${s.precio ?? ''},"${estado}","${s.notes}"`)
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url
  a.download = `informe-${row.patientName.replace(/\s+/g, '-').toLowerCase()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── CSV general ───────────────────────────────────────────────────────────────
function exportFullCSV(rows, name) {
  const allTypes = [...new Set(rows.flatMap((r) => Object.keys(r.typeCounts)))]
  const header   = ['Paciente', ...allTypes.flatMap((k) => [`${k} ag.`, `${k} as.`, `${k} monto`]), 'Total ag.', 'Total as.', '%', 'Monto Bruto'].join(',')
  const body = rows.map((r) => {
    const typeCols = allTypes.flatMap((k) => {
      const tc = r.typeCounts?.[k] ?? { total: 0, attended: 0, montoAgendado: 0 }
      return [tc.total, tc.attended, tc.montoAgendado]
    })
    return [`"${r.patientName}"`, ...typeCols, r.total, r.attended, `${r.pct}%`, r.montoTotal].join(',')
  }).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url
  a.download = `reporte-${name}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── PDF general ───────────────────────────────────────────────────────────────
function exportPDF(rows, name) {
  const doc    = new jsPDF()
  const purple = [124, 58, 237]
  let y = 14

  y = drawHeader(doc, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...purple)
  doc.text('Reporte de Asistencia', 14, y); y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(name, 14, y); y += 5
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, y); y += 7

  autoTable(doc, {
    startY: y,
    head: [['Paciente', 'Servicios', 'Agendadas', 'Completadas', 'No efect.', '%', 'Monto Bruto']],
    body: rows.map((r) => [
      r.patientName + (r.description ? `\n${r.description}` : ''),
      Object.entries(r.typeCounts)
        .filter(([, tc]) => tc.total > 0)
        .map(([type, tc]) => `${type}: ${tc.attended}/${tc.total}${tc.montoAgendado > 0 ? ` (${formatCLP(tc.montoAgendado)})` : ''}`)
        .join('\n'),
      r.total, r.attended, r.absent, `${r.pct}%`,
      r.montoTotal > 0 ? formatCLP(r.montoTotal) : '—',
    ]),
    headStyles: { fillColor: purple, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [253, 248, 240] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { cellWidth: 60 }, 6: { halign: 'right', fontStyle: 'bold' } },
  })

  // Totales
  const totalMonto     = rows.reduce((a, r) => a + r.montoTotal, 0)
  const totalSesiones  = rows.reduce((a, r) => a + r.total, 0)
  const totalAsistidas = rows.reduce((a, r) => a + r.attended, 0)
  const yFinal = doc.lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...purple)
  doc.text(`Total general: ${totalSesiones} sesiones · ${totalAsistidas} completadas · Monto Bruto: ${formatCLP(totalMonto)}`, 14, yFinal)

  doc.save(`reporte-${name}.pdf`)
}

// ── Tabla de reporte (web) ────────────────────────────────────────────────────
function ReportTable({ report, helpers }) {
  const { uniqueRows = [], name, recargoRules } = report
  const { textOf, barOf, shortOf } = helpers

  if (uniqueRows.length === 0) {
    return <p className="text-gray-400 py-4 text-center">Sin eventos en este período</p>
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl shadow mb-4">
        <table className="w-full text-sm font-body">
          <thead className="bg-purple text-white">
            <tr>
              {['', 'Paciente', 'Servicios', 'Agendadas', 'Completadas', 'No efect.', '%', 'Monto Bruto'].map((h, i) => (
                <th key={i} className="py-3 px-3 text-left font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueRows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cream'}>
                <td className="py-2 px-3 whitespace-nowrap">
                  <button
                    onClick={() => exportPatientCSV(r)}
                    className="bg-teal/10 hover:bg-teal/20 text-teal border border-teal/30 text-xs font-bold px-2 py-1 rounded-full transition mr-1"
                    title="CSV de este paciente"
                  >CSV</button>
                  <button
                    onClick={() => exportPatientPDF(r, name, recargoRules)}
                    className="bg-purple/10 hover:bg-purple/20 text-purple border border-purple/30 text-xs font-bold px-2 py-1 rounded-full transition"
                    title="PDF de este paciente"
                  >PDF</button>
                </td>
                <td className="py-3 px-3 font-bold text-gray-800 whitespace-nowrap">
                  {r.patientName}
                  {r.description && (
                    <p className="text-xs font-normal text-gray-400 truncate max-w-32">{r.description}</p>
                  )}
                </td>

                {/* Barras de progreso por tipo */}
                <td className="py-3 px-3">
                  <div className="space-y-2 min-w-32">
                    {Object.entries(r.typeCounts)
                      .filter(([, tc]) => tc.total > 0)
                      .map(([type, tc]) => {
                        const pct = tc.total > 0 ? Math.round((tc.attended / tc.total) * 100) : 0
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-xs ${textOf(type)}`}>{shortOf(type)}</span>
                              <span className="text-xs text-gray-500 font-mono">
                                {tc.attended}<span className="text-gray-300">/{tc.total}</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barOf(type)}`} style={{ width: `${pct}%` }} />
                            </div>
                            {tc.montoAgendado > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5 font-mono">{formatCLP(tc.montoAgendado)}</p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </td>

                <td className="py-3 px-3 text-gray-500 text-center font-mono">{r.total}</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-block bg-green-100 text-green-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {r.attended}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded-full ${r.absent > 0 ? 'bg-red-50 text-red-500' : 'text-gray-300'}`}>
                    {r.absent > 0 ? r.absent : '—'}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`font-bold text-sm ${r.pct >= 80 ? 'text-green-600' : 'text-orange'}`}>{r.pct}%</span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-gray-700 whitespace-nowrap">
                  {r.montoTotal > 0 ? formatCLP(r.montoTotal) : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Fila de totales */}
          <tfoot className="bg-purple/10 border-t-2 border-purple/20">
            <tr>
              <td colSpan={3} className="py-2 px-3 text-xs font-bold text-purple">Total general</td>
              <td className="py-2 px-3 text-center font-mono font-bold text-gray-700">{uniqueRows.reduce((a, r) => a + r.total, 0)}</td>
              <td className="py-2 px-3 text-center font-bold text-green-700">{uniqueRows.reduce((a, r) => a + r.attended, 0)}</td>
              <td className="py-2 px-3 text-center font-bold text-red-500">{uniqueRows.reduce((a, r) => a + r.absent, 0)}</td>
              <td className="py-2 px-3"></td>
              <td className="py-2 px-3 text-right font-mono font-bold text-purple">
                {formatCLP(uniqueRows.reduce((a, r) => a + r.montoTotal, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => exportFullCSV(uniqueRows, name)}
          className="bg-teal hover:bg-teal/80 text-white font-bold py-2.5 px-5 rounded-full transition text-sm"
        >
          📥 CSV general
        </button>
        <button
          onClick={() => exportPDF(uniqueRows, name)}
          className="bg-purple hover:bg-purple/80 text-white font-bold py-2.5 px-5 rounded-full transition text-sm"
        >
          📄 PDF
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function MonthlyReport() {
  const { accessToken } = useAuth()
  const now = new Date()

  const [year, setYear]         = useState(now.getFullYear())
  const [month, setMonth]       = useState(now.getMonth())
  const [report, setReport]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [serviceTypes, setServiceTypes] = useState([])

  useEffect(() => {
    getServiceTypes()
      .then(setServiceTypes)
      .catch((e) => console.error('[MonthlyReport] serviceTypes:', e))
  }, [])

  const helpers = makeHelpers(serviceTypes)

  const prevMonth = () => { setReport(null); if (month === 0) { setYear((y) => y - 1); setMonth(11) } else setMonth((m) => m - 1) }
  const nextMonth = () => { setReport(null); if (month === 11) { setYear((y) => y + 1); setMonth(0) } else setMonth((m) => m + 1) }

  const monthLabel = new Date(year, month).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  const handleGenerate = async () => {
    if (!accessToken || loading) return
    setError(null); setReport(null); setLoading(true)
    try {
      const start = new Date(year, month, 1, 0, 0, 0)
      const end   = new Date(year, month + 1, 0, 23, 59, 59)

      const [freshTypes, calData, sessions, patients, recargoRules] = await Promise.all([
        getServiceTypes().catch(() => serviceTypes),
        getPrivateEvents(accessToken, start.toISOString(), end.toISOString()),
        getSessionsInRange(start, end).catch(() => []),
        getAllPatients().catch(() => []),
        getRecargoRules().catch(() => DEFAULT_RECARGO_RULES),
      ])
      setServiceTypes(freshTypes)

      const events     = calData.items ?? []
      const sessionMap = Object.fromEntries(sessions.map((s) => [s.calendarEventId, s]))
      const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))
      setReport({ name: monthLabel, uniqueRows: buildUniqueRows(events, sessionMap, patientMap, freshTypes, recargoRules), recargoRules })
    } catch (err) {
      setError(err.message ?? 'Error al generar reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="font-heading text-3xl text-purple mb-6">Reporte de Asistencia</h2>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <button onClick={prevMonth} className="px-4 py-3 text-purple font-bold text-lg hover:bg-purple/10 transition">‹</button>
          <span className="px-4 py-3 font-bold text-gray-800 text-sm capitalize min-w-36 text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="px-4 py-3 text-purple font-bold text-lg hover:bg-purple/10 transition">›</button>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !accessToken}
          className="bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-6 py-3 rounded-2xl transition shadow-sm"
        >
          {loading ? '⏳ Generando...' : '⚡ Generar'}
        </button>
      </div>

      {!accessToken && (
        <p className="text-orange text-sm mb-4">Iniciá sesión con Google Calendar para generar reportes.</p>
      )}
      {loading && <LoadingSpinner color="text-purple" />}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm font-mono">{error}</div>
      )}

      {report && !loading && (
        <div className="bg-teal/5 rounded-2xl border border-teal/40 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-teal bg-teal/10 border border-teal/30 px-2 py-0.5 rounded-full">⚡ Generado ahora</span>
          </div>
          <h3 className="font-heading text-xl text-teal mb-1">{report.name}</h3>
          <p className="text-xs text-gray-400 mb-4">{report.uniqueRows?.length ?? 0} paciente(s)</p>
          <ReportTable report={report} helpers={helpers} />
        </div>
      )}
    </div>
  )
}
