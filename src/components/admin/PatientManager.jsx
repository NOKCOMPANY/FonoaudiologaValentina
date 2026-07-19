import { useState, useEffect, useRef } from 'react'
import { getAllPatients, updatePatientInfo, mergePatients, deletePatient, getSessionsInRange } from '../../hooks/useFirestore'
import { getPrivateEvents } from '../../lib/googleCalendar'
import { parseEvent } from '../../lib/parseEvent'
import { colorVariant } from '../../lib/colorMaps'

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s_]+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function findDuplicateGroups(patients) {
  const groups = {}
  patients.forEach((p) => {
    const key = normalize(p.fullName || p.name || p.id)
    if (!key) return
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  })
  return Object.values(groups).filter((g) => g.length > 1)
}

// Puntúa cuántas palabras empiezan con mayúscula — para elegir el mejor casing de un nombre
function scoreCase(s) {
  return (s.match(/\b[A-ZÁÉÍÓÚÑ]/gu) ?? []).length
}

async function detectPatientsFromCalendar(accessToken) {
  const now = new Date()
  // Ventana amplia: 90 días atrás + 90 días adelante
  const timeMin = new Date(now); timeMin.setDate(now.getDate() - 90)
  const timeMax = new Date(now); timeMax.setDate(now.getDate() + 90)
  const data   = await getPrivateEvents(accessToken, timeMin.toISOString(), timeMax.toISOString())
  const events = data.items ?? []

  // Parsear todos los eventos
  const parsed = events
    .map((ev) => parseEvent(ev.summary ?? ''))
    .filter((p) => p.patientId && p.patientName)

  // Mapa patientId → mejor patientName (el que tiene más palabras en mayúscula)
  const bestName = {}
  parsed.forEach((p) => {
    const current = bestName[p.patientId]
    if (!current || scoreCase(p.patientName) > scoreCase(current)) {
      bestName[p.patientId] = p.patientName
    }
  })

  // Mapa patientId → Set de tipos detectados (sin deduplicar — todos los eventos cuentan)
  const calendarTypeMap = {}
  parsed.forEach((p) => {
    if (!p.type) return
    if (!calendarTypeMap[p.patientId]) calendarTypeMap[p.patientId] = new Set()
    calendarTypeMap[p.patientId].add(p.type)
  })

  const detected = Object.entries(bestName).map(([id, name]) => ({ id, name }))
  const typeMap  = Object.fromEntries(
    Object.entries(calendarTypeMap).map(([k, v]) => [k, [...v]])
  )

  return { detected, calendarTypeMap: typeMap }
}

// ── Tarjeta de paciente ────────────────────────────────────────────────────────
function PatientCard({ p, sessionTypes, serviceTypes, knownTypeNames, edits, setEdits, onSave, saving, saved, isDuplicate }) {
  const displayName = p.fullName || p.name || p.id
  const calId       = p.name || p.id
  const showCalId   = p.fullName && calId !== p.fullName

  // Filtrar tipos reales: excluir null, vacío y "Sin clasificar" (dato legacy)
  const allTypes        = sessionTypes[p.id] ?? []
  const types           = allTypes.filter((t) => t && t !== 'Sin clasificar')
  const unknownOwnTypes = knownTypeNames
    ? types.filter((t) => !knownTypeNames.has(t))
    : []

  // Lookup dinámico de color desde serviceTypes (usa colorMaps centralizado)
  const colorOf = (typeName) => {
    const st = serviceTypes.find((s) => s.displayName === typeName)
    return colorVariant(st?.color, 'badge')
  }

  const initials = displayName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

  // Avatar color: primer tipo conocido determina el color
  const firstKnown  = types.find((t) => serviceTypes.some((s) => s.displayName === t))
  const avatarColor = colorVariant(
    serviceTypes.find((s) => s.displayName === firstKnown)?.color,
    'avatar'
  )

  return (
    <div className={`rounded-2xl border overflow-hidden transition-shadow ${
      isDuplicate ? 'border-orange/40 shadow-sm shadow-orange/10' : 'border-gray-200'
    }`}>

      {/* ── Header ─── */}
      <div className={`px-4 py-3 flex items-center gap-3 ${isDuplicate ? 'bg-orange/5' : 'bg-gray-50'}`}>
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-sm ${avatarColor}`}>
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800 text-sm leading-tight truncate">{displayName}</p>
          {showCalId && <p className="text-xs text-gray-400 font-mono truncate mt-0.5">📅 {calId}</p>}
          {!p.fullName && <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{calId}</p>}
        </div>
        {isDuplicate && (
          <span className="flex-shrink-0 text-xs bg-orange/10 text-orange border border-orange/30 px-2 py-0.5 rounded-full font-bold">
            ⚠ Dup.
          </span>
        )}
      </div>

      {/* ── Badges de tipo de servicio ─── */}
      <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-1.5 flex-wrap items-center min-h-[36px]">
        {types.map((t) => (
          <span key={t} className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorOf(t)}`}>
            {t}
          </span>
        ))}
        {types.length === 0 && (
          <span className="text-xs text-amber-500 font-semibold">⚠ Sin tipo — revisá el formato en el calendario</span>
        )}
        {unknownOwnTypes.length > 0 && (
          <span className="text-xs text-amber-500 font-semibold">⚠ Sin regla: {unknownOwnTypes.join(', ')}</span>
        )}
      </div>

      {/* ── Campos editables ─── */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-3">
        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1">
            <span>👤</span> Nombre completo
          </label>
          <input
            type="text"
            placeholder="Ej: Martina González Rojas"
            value={edits[p.id]?.fullName ?? ''}
            onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], fullName: e.target.value } }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 bg-white placeholder-gray-300"
          />
        </div>
        <div>
          <label className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1">
            <span>📋</span> Descripción / Diagnóstico
          </label>
          <input
            type="text"
            placeholder="Ej: 6 años, dislalia, terapia semanal"
            value={edits[p.id]?.description ?? ''}
            onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...prev[p.id], description: e.target.value } }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 bg-white placeholder-gray-300"
          />
        </div>
        <button
          onClick={() => onSave(p.id)}
          disabled={saving}
          className="text-xs bg-purple hover:bg-purple-dark disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-full transition"
        >
          {saved ? '✅ Guardado' : saving ? '⏳' : '💾 Guardar'}
        </button>
      </div>
    </div>
  )
}

// ── Panel de fusión ────────────────────────────────────────────────────────────
function MergePanel({ group, onMerge, onCancel, merging }) {
  const [primaryId, setPrimaryId] = useState(group[0]?.id ?? '')
  const secondaryIds = group.filter((p) => p.id !== primaryId).map((p) => p.id)
  const primary      = group.find((p) => p.id === primaryId)

  return (
    <div className="bg-orange/5 border border-orange/30 rounded-2xl p-4 mb-4">
      <p className="text-sm font-bold text-orange mb-1">🔀 Fusionar duplicados</p>
      <p className="text-xs text-gray-500 mb-3">
        Elegí cuál es el registro principal. Las sesiones del otro se migrarán a este y el duplicado se borrará.
      </p>
      <div className="space-y-2 mb-4">
        {group.map((p) => (
          <label key={p.id} className="flex items-start gap-3 cursor-pointer">
            <input type="radio" name="primary" value={p.id} checked={primaryId === p.id}
              onChange={() => setPrimaryId(p.id)} className="mt-0.5 accent-purple" />
            <div>
              <p className="text-sm font-bold text-gray-700">{p.fullName || p.name || p.id}</p>
              <p className="text-xs text-gray-400 font-mono">{p.id}</p>
              {p.description && <p className="text-xs text-gray-500 italic">{p.description}</p>}
            </div>
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Se conserva <span className="font-bold text-gray-700">{primary?.fullName || primary?.name || primaryId}</span> y se eliminan {secondaryIds.length} duplicado(s).
      </p>
      <div className="flex gap-2">
        <button onClick={() => onMerge(primaryId, secondaryIds)} disabled={merging}
          className="text-xs bg-orange hover:bg-orange/80 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-full transition">
          {merging ? '⏳ Fusionando...' : '🔀 Confirmar fusión'}
        </button>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-full transition">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export function PatientManager({ accessToken, serviceTypes = [], knownTypeNames, onTypesDetected, onPatientsLoaded }) {
  const [openFormat, setOpenFormat]     = useState(false)
  const [openPatients, setOpenPatients] = useState(false)

  const [patients, setPatients]         = useState([])
  const [sessionTypes, setSessionTypes] = useState({})
  const [loading, setLoading]           = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [edits, setEdits]               = useState({})
  const [saving, setSaving]             = useState(new Set())
  const [saved, setSaved]               = useState(new Set())

  const [mergeGroup, setMergeGroup]     = useState(null)
  const [merging, setMerging]           = useState(false)
  const [mergeError, setMergeError]     = useState(null)
  const [mergeSuccess, setMergeSuccess] = useState(null)

  // Ref para evitar sincronización simultánea
  const refreshingRef = useRef(false)

  const duplicateGroups = findDuplicateGroups(patients)
  const duplicateIds    = new Set(duplicateGroups.flat().map((p) => p.id))

  // Notifica al padre cuando sessionTypes cambia (nunca dentro de un updater)
  useEffect(() => {
    if (!onTypesDetected) return
    const allTypes = [...new Set(Object.values(sessionTypes).flat().filter(Boolean))]
    const countMap = {}
    Object.values(sessionTypes).forEach((types) => {
      types.forEach((t) => { if (t) countMap[t] = (countMap[t] ?? 0) + 1 })
    })
    onTypesDetected(allTypes, countMap)
  }, [sessionTypes, onTypesDetected])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3)

      const [list, sessions] = await Promise.all([
        getAllPatients(),
        getSessionsInRange(threeMonthsAgo, now).catch(() => []),
      ])

      // Fuente 1: patient.detectedTypes (persistido en Firestore al sincronizar con calendario)
      const typeMap = {}
      list.forEach((p) => {
        if (Array.isArray(p.detectedTypes) && p.detectedTypes.length > 0) {
          typeMap[p.id] = new Set(p.detectedTypes.filter((t) => t && t !== 'Sin clasificar'))
        }
      })

      // Fuente 2: session.type (de asistencias marcadas manualmente)
      sessions.forEach((s) => {
        if (!s.patientId || !s.type || s.type === 'Sin clasificar') return
        if (!typeMap[s.patientId]) typeMap[s.patientId] = new Set()
        typeMap[s.patientId].add(s.type)
      })

      const resolved = Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [k, [...v]]))
      setSessionTypes(resolved)

      setPatients(list)
      if (onPatientsLoaded) onPatientsLoaded(list)
      const initial = {}
      list.forEach((p) => { initial[p.id] = { fullName: p.fullName ?? '', description: p.description ?? '' } })
      setEdits(initial)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPatients() }, [])

  const refreshFromCalendar = async () => {
    if (!accessToken || refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    try {
      const { detected, calendarTypeMap } = await detectPatientsFromCalendar(accessToken)
      const detectedIds        = new Set(detected.map((d) => d.id))
      const detectedNormalized = new Set(
        detected.flatMap((d) => [normalize(d.id), normalize(d.name)].filter(Boolean))
      )

      const existingIds        = new Set(patients.map((p) => p.id))
      const existingNormalized = new Set(
        patients.flatMap((p) => [
          normalize(p.id), normalize(p.name), normalize(p.fullName),
          ...(Array.isArray(p.aliases) ? p.aliases.map(normalize) : []),
        ].filter(Boolean))
      )

      // Agregar nuevos — usar el nombre con mejor casing del calendario
      const toAdd = detected.filter((d) =>
        !existingIds.has(d.id) &&
        !existingNormalized.has(normalize(d.id)) &&
        !existingNormalized.has(normalize(d.name))
      )
      if (toAdd.length > 0) {
        await Promise.all(toAdd.map((p) =>
          updatePatientInfo(p.id, { name: p.name, fullName: '', description: '' })
        ))
      }

      // Actualizar el nombre de pacientes existentes si el calendario tiene mejor casing
      const toUpdate = detected.filter((d) => {
        const existing = patients.find((p) => p.id === d.id)
        if (!existing) return false
        if (existing.fullName) return false  // ya tiene nombre completo, no sobreescribir
        return existing.name !== d.name && scoreCase(d.name) > scoreCase(existing.name ?? '')
      })
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map((p) =>
          updatePatientInfo(p.id, { name: p.name })
        ))
      }

      // El calendario es la fuente de verdad: eliminar todo paciente que ya no aparezca
      const toRemove = patients.filter((p) => {
        if (detectedIds.has(p.id))                                       return false
        const aliases = Array.isArray(p.aliases) ? p.aliases : []
        if (aliases.some((a) => detectedIds.has(a)))                     return false
        if (detectedNormalized.has(normalize(p.id)))                     return false
        if (detectedNormalized.has(normalize(p.name)))                   return false
        if (p.fullName && detectedNormalized.has(normalize(p.fullName))) return false
        return true
      })
      if (toRemove.length > 0) {
        await Promise.all(toRemove.map((p) => deletePatient(p.id)))
      }

      // Persistir tipos detectados en Firestore (para que sobrevivan recargas de página)
      await Promise.all(detected.map((d) => {
        const types = calendarTypeMap[d.id]
        if (!types || types.length === 0) return Promise.resolve()
        return updatePatientInfo(d.id, { detectedTypes: types })
      }))

      // Recargar desde Firestore — ya incluye detectedTypes, no hace falta merge aparte
      await loadPatients()
    } catch (e) {
      console.error(e)
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
    }
  }

  // Auto-sync al abrir la sección de pacientes
  const handleOpenPatients = () => {
    const opening = !openPatients
    setOpenPatients(opening)
    if (opening && accessToken && !refreshingRef.current) {
      refreshFromCalendar()
    }
  }

  const handleSave = async (patientId) => {
    setSaving((s) => new Set(s).add(patientId))
    try {
      await updatePatientInfo(patientId, edits[patientId] ?? {})
      setSaved((s) => { const n = new Set(s); n.add(patientId); return n })
      setTimeout(() => setSaved((s) => { const n = new Set(s); n.delete(patientId); return n }), 2000)
    } catch (e) { console.error(e) }
    finally { setSaving((s) => { const n = new Set(s); n.delete(patientId); return n }) }
  }

  const handleMerge = async (primaryId, secondaryIds) => {
    setMerging(true); setMergeError(null)
    try {
      for (const secId of secondaryIds) { await mergePatients(primaryId, secId) }
      setMergeSuccess(`✅ Fusión completada — ${secondaryIds.length} duplicado(s) eliminado(s)`)
      setMergeGroup(null)
      await loadPatients()
      setTimeout(() => setMergeSuccess(null), 4000)
    } catch (e) { setMergeError(e.message ?? 'Error al fusionar') }
    finally { setMerging(false) }
  }

  return (
    <div className="rounded-2xl border border-purple/20 bg-white mb-6 overflow-hidden">

      {/* ── Instrucciones ──────────────────────────────────── */}
      <button onClick={() => setOpenFormat((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition">
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          📋 ¿Cómo agregar sesiones al calendario?
        </span>
        <span className="text-purple">{openFormat ? '▲' : '▼'}</span>
      </button>

      {openFormat && (
        <div className="px-4 pb-5 space-y-4 text-sm font-body text-gray-600 border-t border-purple/10 pt-4">
          <div>
            <p className="font-bold text-gray-800 mb-1">Formato en Google Calendar:</p>
            <code className="bg-gray-100 rounded-lg px-3 py-2 block text-sm text-gray-700">Tipo Nombre del niño</code>
            <p className="text-xs text-gray-500 mt-1">El guión es opcional — también funciona <span className="font-mono">BS - Martina</span></p>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">Ejemplos:</p>
            <div className="space-y-1">
              {[
                { ex: 'BS Martina', color: 'bg-teal/10 text-teal border-teal/30' },
                { ex: 'Terapia Juan', color: 'bg-purple/10 text-purple border-purple/30' },
                { ex: 'Taller Sofía', color: 'bg-orange/10 text-orange border-orange/30' },
                { ex: 'Fono Camila', color: 'bg-gray-100 text-gray-500 border-gray-200' },
              ].map(({ ex, color }) => (
                <div key={ex} className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${color}`}>{ex}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">La primera palabra es el tipo — puede ser cualquiera. Definí reglas en "Tipos de servicio".</p>
          </div>
          <div className="bg-orange/10 border border-orange/30 rounded-xl px-3 py-2">
            <p className="text-orange font-bold text-xs">
              ⚠️ El nombre del paciente debe ser <strong>siempre idéntico</strong> para que los reportes agrupen correctamente. El calendario es la fuente de verdad.
            </p>
          </div>
          <div className="bg-purple/5 border border-purple/20 rounded-xl px-3 py-2.5">
            <p className="text-purple font-bold text-xs mb-1.5">💰 Regla de precios (monto bruto CLP)</p>
            <p className="text-xs text-gray-500 mb-1.5">Se configura en <strong>Tipos de servicio</strong> — dos modos disponibles:</p>
            <div className="space-y-1.5 text-xs">
              <div className="bg-white border border-purple/10 rounded-lg px-2.5 py-1.5">
                <p className="font-bold text-gray-700">Por hora <span className="text-gray-400 font-normal">(proporcional)</span></p>
                <p className="text-gray-500 font-mono">  0:30 h → precio ÷ 2  ·  1:00 h → precio  ·  1:30 h → precio × 1,5</p>
              </div>
              <div className="bg-white border border-purple/10 rounded-lg px-2.5 py-1.5">
                <p className="font-bold text-gray-700">Precio fijo <span className="text-gray-400 font-normal">(por sesión)</span></p>
                <p className="text-gray-500">Se cobra siempre el mismo monto sin importar la duración real.</p>
                <p className="text-gray-400 font-mono">  Ej: Taller = $30.000 fija · ref 3 h</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">• Eventos de <strong>día completo</strong> (sin hora) → sin cálculo de precio en modo por hora</p>
          </div>
        </div>
      )}

      {/* ── Pacientes ──────────────────────────────────────── */}
      <button onClick={handleOpenPatients}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple/5 transition border-t border-purple/10">
        <span className="font-bold text-purple text-sm flex items-center gap-2">
          👤 Pacientes registrados
          <span className="text-xs font-normal text-gray-400">({patients.length})</span>
          {duplicateGroups.length > 0 && (
            <span className="text-xs font-bold bg-orange/10 text-orange border border-orange/30 px-2 py-0.5 rounded-full">
              {duplicateGroups.length} dup.
            </span>
          )}
          {refreshing && <span className="text-xs text-purple/60 animate-pulse">Sincronizando…</span>}
        </span>
        <span className="text-purple">{openPatients ? '▲' : '▼'}</span>
      </button>

      {openPatients && (
        <div className="px-4 pb-5 border-t border-purple/10 pt-4">

          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={loadPatients} disabled={loading}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-1.5 rounded-full transition disabled:opacity-40">
              {loading ? '⏳' : '🔄'} Refrescar
            </button>
            {accessToken && (
              <button onClick={refreshFromCalendar} disabled={refreshing}
                className="text-xs bg-purple/10 hover:bg-purple/20 text-purple font-bold px-3 py-1.5 rounded-full transition disabled:opacity-40">
                {refreshing ? '⏳ Sincronizando...' : '📅 Sincronizar desde calendario'}
              </button>
            )}
          </div>

          {mergeSuccess && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700 text-xs font-bold">
              {mergeSuccess}
            </div>
          )}
          {mergeError && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs font-mono flex justify-between">
              {mergeError}
              <button onClick={() => setMergeError(null)}>✕</button>
            </div>
          )}

          {mergeGroup && (
            <MergePanel group={mergeGroup} onMerge={handleMerge} onCancel={() => setMergeGroup(null)} merging={merging} />
          )}

          {duplicateGroups.length > 0 && !mergeGroup && (
            <div className="mb-4 space-y-2">
              {duplicateGroups.map((group, i) => (
                <div key={i} className="bg-orange/5 border border-orange/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-orange">⚠ Posibles duplicados</p>
                    <p className="text-xs text-gray-500 truncate">
                      {group.map((p) => p.fullName || p.name || p.id).join(' · ')}
                    </p>
                  </div>
                  <button onClick={() => setMergeGroup(group)}
                    className="flex-shrink-0 text-xs bg-orange/10 hover:bg-orange/20 text-orange border border-orange/30 font-bold px-3 py-1 rounded-full transition">
                    🔀 Fusionar
                  </button>
                </div>
              ))}
            </div>
          )}

          {patients.length === 0 && !loading && (
            <p className="text-gray-400 text-xs text-center py-4">
              Sin pacientes aún — marcá asistencia para que aparezcan aquí
            </p>
          )}

          <div className="space-y-3">
            {patients.map((p) => (
              <PatientCard
                key={p.id}
                p={p}
                sessionTypes={sessionTypes}
                serviceTypes={serviceTypes}
                knownTypeNames={knownTypeNames}
                edits={edits}
                setEdits={setEdits}
                onSave={handleSave}
                saving={saving.has(p.id)}
                saved={saved.has(p.id)}
                isDuplicate={duplicateIds.has(p.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
