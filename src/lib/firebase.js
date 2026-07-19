import { initializeApp } from 'firebase/app'
import { initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { config } from './config'

const app = initializeApp(config.firebase)

// experimentalForceLongPolling: fuerza HTTP en vez de WebSocket
// Soluciona casos donde el WebSocket de Firestore queda bloqueado silenciosamente
export const db   = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, 'vale')
export const auth = getAuth(app)
