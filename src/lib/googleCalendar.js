import { config } from './config'

const BASE = 'https://www.googleapis.com/calendar/v3'
const TIMEOUT_MS = 12000

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

// Public: FreeBusy — nunca expone nombres de pacientes
export async function getPublicFreeBusy(timeMin, timeMax) {
  const res = await fetchWithTimeout(`${BASE}/freeBusy?key=${config.googleApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: config.calendarId }],
    }),
  })
  if (!res.ok) throw new Error(`FreeBusy ${res.status}`)
  const data = await res.json()
  const cal  = data.calendars?.[config.calendarId]
  if (cal?.errors?.length) {
    throw new Error(
      `El calendario no está accesible públicamente (${cal.errors[0].reason}). ` +
      `Activa "Ver solo disponible/ocupado" en los permisos del calendario de Google.`
    )
  }
  return cal?.busy ?? []
}

// Private: eventos con nombres completos (requiere access token OAuth)
export async function getPrivateEvents(accessToken, timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
  })
  const res = await fetchWithTimeout(
    `${BASE}/calendars/${encodeURIComponent(config.calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Calendar API ${res.status}`)
  }
  return res.json()
}
