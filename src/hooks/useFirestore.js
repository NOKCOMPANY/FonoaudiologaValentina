import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc,
  query, where, Timestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { withTimeout } from '../lib/withTimeout'

function requireAuth() {
  const user = auth.currentUser
  if (!user) throw new Error('[auth/no-current-user] Firebase no tiene usuario activo — vuelve a iniciar sesión')
  return user
}

export async function markAttendanceWithPatient(calendarEventId, patientId, patientName, attended, notes = '', type = '') {
  const user = requireAuth()
  console.log('[Firestore] escribiendo como:', user.email, '| patientId:', patientId)
  await withTimeout(
    Promise.all([
      setDoc(doc(db, 'patients', patientId), { name: patientName }, { merge: true }),
      setDoc(doc(db, 'sessions', calendarEventId), {
        patientId, calendarEventId, date: Timestamp.now(), attended, notes, type,
      }, { merge: true }),
    ]),
    15000, 'guardar asistencia'
  )
}

export async function getSessionsInRange(startDate, endDate) {
  const q = query(
    collection(db, 'sessions'),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  )
  const snap = await withTimeout(getDocs(q), 10000, 'obtener sesiones')
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllPatients() {
  const snap = await withTimeout(getDocs(collection(db, 'patients')), 10000, 'obtener pacientes')
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateSessionType(calendarEventId, newType) {
  requireAuth()
  await withTimeout(
    setDoc(doc(db, 'sessions', calendarEventId), { type: newType }, { merge: true }),
    10000, 'actualizar tipo de sesión'
  )
}

/**
 * Fusiona dos pacientes: migra sesiones del secundario al principal,
 * guarda el ID secundario como alias, y borra el doc secundario.
 */
export async function mergePatients(primaryId, secondaryId) {
  requireAuth()
  if (primaryId === secondaryId) throw new Error('Los IDs deben ser distintos')

  const [primarySnap, secondarySnap] = await Promise.all([
    withTimeout(getDoc(doc(db, 'patients', primaryId)), 8000, 'leer paciente principal'),
    withTimeout(getDoc(doc(db, 'patients', secondaryId)), 8000, 'leer paciente secundario'),
  ])
  const primaryData   = primarySnap.data()   ?? {}
  const secondaryData = secondarySnap.data() ?? {}

  const q    = query(collection(db, 'sessions'), where('patientId', '==', secondaryId))
  const snap = await withTimeout(getDocs(q), 10000, 'buscar sesiones del duplicado')

  if (snap.docs.length > 0) {
    await withTimeout(
      Promise.all(snap.docs.map((d) =>
        setDoc(doc(db, 'sessions', d.id), { patientId: primaryId }, { merge: true })
      )),
      15000, 'migrar sesiones'
    )
  }

  // Unir aliases y detectedTypes de ambos registros
  const existingAliases = Array.isArray(primaryData.aliases) ? primaryData.aliases : []
  const newAliases = [...new Set([
    ...existingAliases,
    secondaryId,
    ...(Array.isArray(secondaryData.aliases) ? secondaryData.aliases : []),
  ])]

  const mergedTypes = [...new Set([
    ...(Array.isArray(primaryData.detectedTypes)   ? primaryData.detectedTypes   : []),
    ...(Array.isArray(secondaryData.detectedTypes) ? secondaryData.detectedTypes : []),
  ])]

  await withTimeout(
    setDoc(doc(db, 'patients', primaryId), {
      aliases:       newAliases,
      fullName:      primaryData.fullName      || secondaryData.fullName      || '',
      description:   primaryData.description   || secondaryData.description   || '',
      name:          primaryData.name          || secondaryData.name          || primaryId,
      detectedTypes: mergedTypes,
    }, { merge: true }),
    10000, 'actualizar paciente principal'
  )

  await withTimeout(deleteDoc(doc(db, 'patients', secondaryId)), 10000, 'eliminar paciente duplicado')
}

/**
 * Elimina el paciente Y todas sus sesiones huérfanas.
 */
export async function deletePatient(patientId) {
  requireAuth()
  const q    = query(collection(db, 'sessions'), where('patientId', '==', patientId))
  const snap = await withTimeout(getDocs(q), 10000, 'buscar sesiones del paciente')
  await withTimeout(
    Promise.all([
      deleteDoc(doc(db, 'patients', patientId)),
      ...snap.docs.map((d) => deleteDoc(doc(db, 'sessions', d.id))),
    ]),
    15000, 'eliminar paciente y sesiones'
  )
}

/**
 * Actualiza datos editables del paciente.
 * detectedTypes: array de tipos detectados desde el calendario — se persiste en el doc
 * para que loadPatients los lea sin necesitar sincronización en tiempo real.
 */
export async function updatePatientInfo(patientId, { fullName, description, name, detectedTypes } = {}) {
  requireAuth()
  const data = {}
  if (fullName      !== undefined) data.fullName      = fullName
  if (description   !== undefined) data.description   = description
  if (name          !== undefined) data.name          = name
  if (detectedTypes !== undefined) data.detectedTypes = detectedTypes
  await withTimeout(
    setDoc(doc(db, 'patients', patientId), data, { merge: true }),
    10000, 'actualizar paciente'
  )
}

export async function getSessionsByPatient(patientId) {
  const q    = query(collection(db, 'sessions'), where('patientId', '==', patientId))
  const snap = await withTimeout(getDocs(q), 15000, 'obtener sesiones del paciente')
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Tipos de servicio ─────────────────────────────────────────────────────────

const DEFAULT_SERVICE_TYPES = [
  { id: 'babysitter', displayName: 'Babysitter', aliases: ['bs', 'babysitter'], color: 'teal',   order: 0 },
  { id: 'terapia',    displayName: 'Terapia',    aliases: ['terapia'],          color: 'purple', order: 1 },
  { id: 'taller',     displayName: 'Taller',     aliases: ['taller'],           color: 'orange', order: 2 },
]

export async function getServiceTypes() {
  const snap = await withTimeout(getDocs(collection(db, 'serviceTypes')), 10000, 'obtener tipos de servicio')
  if (snap.empty) {
    await Promise.all(DEFAULT_SERVICE_TYPES.map((t) => setDoc(doc(db, 'serviceTypes', t.id), t)))
    return DEFAULT_SERVICE_TYPES
  }
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
}

export async function saveServiceType(id, data) {
  requireAuth()
  await withTimeout(setDoc(doc(db, 'serviceTypes', id), data, { merge: true }), 10000, 'guardar tipo de servicio')
}

export async function deleteServiceType(id) {
  requireAuth()
  await withTimeout(deleteDoc(doc(db, 'serviceTypes', id)), 10000, 'eliminar tipo de servicio')
}
