import {
  collection, doc, getDocs, setDoc,
  query, where, Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function markAttendance(calendarEventId, patientId, attended, notes = '') {
  const ref = doc(db, 'sessions', calendarEventId)
  await setDoc(ref, { patientId, calendarEventId, date: Timestamp.now(), attended, notes }, { merge: true })
}

export async function upsertPatient(patientId, data) {
  const ref = doc(db, 'patients', patientId)
  await setDoc(ref, data, { merge: true })
}

export async function getSessionsInRange(startDate, endDate) {
  const q = query(
    collection(db, 'sessions'),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllPatients() {
  const snap = await getDocs(collection(db, 'patients'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
