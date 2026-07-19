import { config } from './config'

const BASE = 'https://www.googleapis.com/calendar/v3'

// Public: FreeBusy query — nunca expone nombres de pacientes
export async function getPublicFreeBusy(timeMin, timeMax) {
  const res = await fetch(`${BASE}/freeBusy?key=${config.googleApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: config.calendarId }],
    }),
  })
  if (!res.ok) throw new Error(`FreeBusy error: ${res.status}`)
  const data = await res.json()
  return data.calendars?.[config.calendarId]?.busy ?? []
}

// Private: lista eventos completos con nombres (requiere access token OAuth)
export async function getPrivateEvents(accessToken, timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
  })
  const res = await fetch(
    `${BASE}/calendars/${encodeURIComponent(config.calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Calendar events error: ${res.status}`)
  return res.json()
}
