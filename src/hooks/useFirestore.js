import {
  collection, doc, getDocs, setDoc,
  query, where, Timestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { withTimeout } from '../lib/withTimeout'

// Verifica que Firebase Auth esté listo antes de cualquier escritura.
// Si auth.currentUser es null, setDoc encola la escritura esperando auth para siempre.
function requireAuth() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('[auth/no-current-user] Firebase no tiene usuario activo — vuelve a iniciar sesión')
  }
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

export async function saveReport(reportData) {
  requireAuth()
  const ref = doc(collection(db, 'reports'))
  await withTimeout(
    setDoc(ref, { ...reportData, generatedAt: Timestamp.now() }),
    15000, 'guardar reporte'
  )
  return ref.id
}

export async function updateSessionType(calendarEventId, newType) {
  requireAuth()
  await withTimeout(
    setDoc(doc(db, 'sessions', calendarEventId), { type: newType }, { merge: true }),
    10000, 'actualizar tipo de sesión'
  )
}

export async function updatePatientInfo(patientId, { fullName, description }) {
  requireAuth()
  await withTimeout(
    setDoc(doc(db, 'patients', patientId), { fullName, description }, { merge: true }),
    10000, 'actualizar paciente'
  )
}

export async function getReports() {
  const snap = await withTimeout(getDocs(collection(db, 'reports')), 10000, 'cargar historial')
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.generatedAt?.seconds ?? 0) - (a.generatedAt?.seconds ?? 0))
}
