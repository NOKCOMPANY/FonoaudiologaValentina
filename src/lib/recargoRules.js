export const DEFAULT_RECARGO_RULES = {
  fds:            { desdeDia: 5, desdeHora: 20, hastaDia: 0, hastaHora: 23 },
  fueraDeHorario: { hora: 20, hastaHora: 23 },  // siempre solo lunes–jueves (días 1–4)
}

/**
 * Detecta si un evento cae en "fin de semana" o "fuera de horario laboral".
 *
 * PRIORIDAD: fin de semana tiene prioridad total.
 *
 * Fin de semana: rango configurable desde desdeDia/desdeHora hasta hastaDia/hastaHora.
 *   El rango puede cruzar la semana (ej: viernes → domingo).
 *   Defaults: viernes 20:00 → domingo 23:59
 *
 * Fuera de horario: SOLO lunes a jueves (días 1–4), dentro del rango de horas configurado.
 *   No aplica viernes ni fin de semana bajo ninguna configuración.
 *   Defaults: 20:00 → 23:59
 *
 * Eventos de día completo (sin 'T' en ISO) → nunca generan recargo.
 */
export function detectRecargos(startISO, rules) {
  if (!startISO?.includes('T')) return { esFds: false, esFuera: false }

  const r   = rules ?? DEFAULT_RECARGO_RULES
  const fds = r.fds            ?? DEFAULT_RECARGO_RULES.fds
  const fh  = r.fueraDeHorario ?? DEFAULT_RECARGO_RULES.fueraDeHorario

  const d    = new Date(startISO)
  const dia  = d.getDay()                              // 0=dom 1=lun … 5=vie 6=sáb
  const hora = d.getHours() + d.getMinutes() / 60

  const desdeDia  = fds.desdeDia  ?? 5
  const desdeHora = fds.desdeHora ?? 20
  const hastaDia  = fds.hastaDia  ?? 0
  const hastaHora = fds.hastaHora ?? 23

  // Rango fds puede cruzar la semana (ej: vie→dom).
  // Usamos offset relativo al día de inicio para manejar el "wrap".
  const hastaDiaOffset = (hastaDia - desdeDia + 7) % 7
  const diaOffset      = (dia      - desdeDia + 7) % 7
  const isDayInFds     = diaOffset <= hastaDiaOffset

  let esFds = false
  if (isDayInFds) {
    const isFirst = diaOffset === 0
    const isLast  = diaOffset === hastaDiaOffset
    if (isFirst && isLast) {
      // Rango de un solo día
      esFds = hora >= desdeHora && Math.floor(hora) <= hastaHora
    } else if (isFirst) {
      esFds = hora >= desdeHora
    } else if (isLast) {
      esFds = Math.floor(hora) <= hastaHora
    } else {
      esFds = true  // día intermedio → todo el día es fin de semana
    }
  }

  // Fuera de horario: FIJO lunes–jueves (1–4), dentro del rango de horas configurado
  const isMonThu  = dia >= 1 && dia <= 4
  const horaDesde = fh.hora      ?? 20
  const horaHasta = fh.hastaHora ?? 23
  const esFuera   = !esFds && isMonThu && hora >= horaDesde && Math.floor(hora) <= horaHasta

  return { esFds, esFuera }
}

export function recargoLabel(esFds, esFuera) {
  if (esFds)   return 'fin de semana'
  if (esFuera) return 'fuera de horario'
  return null
}

/**
 * Calcula el monto de recargo aplicable dado un evento y un tipo de servicio.
 * Los dos recargos son independientes entre sí pero mutuamente excluyentes
 * por la regla de prioridad (fds tiene prioridad total).
 */
export function calcRecargo(startISO, serviceType, rules) {
  const { esFds, esFuera } = detectRecargos(startISO, rules)
  const montoFds   = esFds   && serviceType?.recargoFds?.activo   ? (serviceType.recargoFds.monto   ?? 0) : 0
  const montoFuera = esFuera && serviceType?.recargoFuera?.activo ? (serviceType.recargoFuera.monto ?? 0) : 0
  return { montoFds, montoFuera, total: montoFds + montoFuera, esFds, esFuera }
}
