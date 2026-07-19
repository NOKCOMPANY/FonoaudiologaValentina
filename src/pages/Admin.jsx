import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PrivateCalendar } from '../components/calendar/PrivateCalendar'
import { TokenRefreshBanner } from '../components/ui/TokenRefreshBanner'
import { PatientManager } from '../components/admin/PatientManager'
import { ServiceTypeManager } from '../components/admin/ServiceTypeManager'
import { BulkAttendance } from '../components/admin/BulkAttendance'
import { RecargoRulesManager } from '../components/admin/RecargoRulesManager'
import { getServiceTypes, getRecargoRules } from '../hooks/useFirestore'
import { setDynamicTypeMap } from '../lib/parseEvent'

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateLabel(d) {
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Admin() {
  const { user, signOut, accessToken } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [serviceTypes, setServiceTypes] = useState([])
  const [recargoRules, setRecargoRules] = useState(null)

  // Tipos detectados desde pacientes (callback de PatientManager)
  const [detectedTypes, setDetectedTypes]     = useState([])  // ['Terapia','Test',...]
  const [patientTypeCount, setPatientTypeCount] = useState({}) // {'Terapia': 2, 'Test': 1}
  const [patients, setPatients]               = useState([])  // lista para BulkAttendance

  const reloadServiceTypes = useCallback(async () => {
    try {
      const types = await getServiceTypes()
      setServiceTypes(types)
      // Actualizar el mapa dinámico de parseEvent con los alias de Firestore
      const aliasMap = {}
      types.forEach((t) => {
        ;(t.aliases ?? []).forEach((a) => {
          const lower = a.toLowerCase()
          const norm  = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          aliasMap[lower] = t.displayName
          aliasMap[norm]  = t.displayName   // también sin tildes
        })
      })
      setDynamicTypeMap(aliasMap)
    } catch (e) {
      console.error('[Admin] error cargando serviceTypes:', e)
    }
  }, [])

  useEffect(() => { reloadServiceTypes() }, [reloadServiceTypes])

  useEffect(() => {
    getRecargoRules()
      .then(setRecargoRules)
      .catch((e) => console.error('[Admin] recargoRules:', e))
  }, [])

  // Tipos detectados que NO tienen regla definida en serviceTypes
  const knownDisplayNames = new Set(serviceTypes.map((t) => t.displayName))
  const unknownTypes = detectedTypes
    .filter((t) => t && !knownDisplayNames.has(t))
    .map((t) => ({ typeName: t, patientCount: patientTypeCount[t] ?? 0 }))

  const handleTypesDetected = useCallback((types, countMap) => {
    setDetectedTypes(types)
    setPatientTypeCount(countMap)
  }, [])

  const handlePatientsLoaded = useCallback((list) => {
    setPatients(list)
  }, [])

  // Contador de invalidación: incrementar fuerza re-fetch en PrivateCalendar
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0)
  const bumpSessionRefresh = useCallback(() => setSessionRefreshKey((k) => k + 1), [])

  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-purple text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Panel Admin</h1>
          <p className="text-purple-light text-xs">{user?.displayName}</p>
          <p className="text-purple-light/70 text-xs font-mono">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link to="/" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition">
            ← Sitio público
          </Link>
          <Link to="/admin/reportes" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition">
            📊 Reportes
          </Link>
          <button onClick={signOut} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition">
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <TokenRefreshBanner />

        <RecargoRulesManager rules={recargoRules} onSaved={setRecargoRules} />

        <ServiceTypeManager
          serviceTypes={serviceTypes}
          patientTypeCount={patientTypeCount}
          unknownTypes={unknownTypes}
          onReload={reloadServiceTypes}
        />

        <PatientManager
          accessToken={accessToken}
          serviceTypes={serviceTypes}
          knownTypeNames={knownDisplayNames}
          onTypesDetected={handleTypesDetected}
          onPatientsLoaded={handlePatientsLoaded}
        />

        <BulkAttendance
          accessToken={accessToken}
          serviceTypes={serviceTypes}
          patients={patients}
          onSaved={bumpSessionRefresh}
          recargoRules={recargoRules}
        />

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="font-bold text-gray-700 text-sm">Fecha:</label>
          <input
            type="date"
            value={toLocalDateStr(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
          />
          <span className="text-gray-500 text-sm capitalize">{dateLabel(selectedDate)}</span>
        </div>

        <h2 className="font-heading text-xl text-gray-700 mb-4">Sesiones del día</h2>
        <PrivateCalendar selectedDate={selectedDate} serviceTypes={serviceTypes} refreshKey={sessionRefreshKey} recargoRules={recargoRules} />
      </div>
    </div>
  )
}
