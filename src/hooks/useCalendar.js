import { useState, useEffect, useCallback } from 'react'
import { getPublicFreeBusy, getPrivateEvents } from '../lib/googleCalendar'

export function usePublicAvailability(weekStart) {
  const [busy, setBusy]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchBusy = useCallback(() => {
    if (!weekStart) return
    const timeMin = weekStart.toISOString()
    const timeMax = new Date(weekStart.getTime() + 7 * 86400000).toISOString()
    setError(null)
    getPublicFreeBusy(timeMin, timeMax)
      .then((data) => { setBusy(data); setLastUpdated(new Date()) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [weekStart?.toISOString()])

  useEffect(() => {
    setLoading(true)
    fetchBusy()
    const id = setInterval(fetchBusy, 60_000)
    return () => clearInterval(id)
  }, [fetchBusy])

  return { busy, loading, error, refetch: fetchBusy, lastUpdated }
}

// dateStr debe ser 'YYYY-MM-DD' en hora local — nunca usar toISOString() para construirlo
export function usePrivateEvents(accessToken, dateStr) {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!accessToken || !dateStr) return
    // Construir límites en hora local para evitar desfase de timezone
    const [year, month, day] = dateStr.split('-').map(Number)
    const start = new Date(year, month - 1, day, 0, 0, 0, 0)
    const end   = new Date(year, month - 1, day, 23, 59, 59, 999)
    setLoading(true)
    setError(null)
    getPrivateEvents(accessToken, start.toISOString(), end.toISOString())
      .then((data) => setEvents(data.items ?? []))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [accessToken, dateStr])

  return { events, loading, error }
}
