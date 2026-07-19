export const DEFAULT_RECARGO_RULES = {
  fds:            { desdeDia: 5, desdeHora: 20 },  // viernes 20:00
  fueraDeHorario: { hora: 20 },
}

/**
 * Detecta si un evento cae en "fin de semana" o "fuera de horario laboral".
 * PRIORIDAD: fin de semana tiene prioridad total. Si el evento es viernes ≥ 20:00
 * → es FIN DE SEMANA, NO fuera de horario.
 * Los eventos de día completo (sin 'T' en ISO) nunca generan recargo.
 */
export function detectRecargos(startISO, rules) {
  if (!startISO?.includes('T')) return { esFds: false, esFuera: false }

  const r   = rules ?? DEFAULT_RECARGO_RULES
  const fds = r.fds            ?? DEFAULT_RECARGO_RULES.fds
  const fh  = r.fueraDeHorario ?? DEFAULT_RECARGO_RULES.fueraDeHorario

  const d    = new Date(startISO)
  const dia  = d.getDay()
  const hora = d.getHours() + d.getMinutes() / 60

  const desdeDia  = fds.desdeDia  ?? 5
  const desdeHora = fds.desdeHora ?? 20
  const horaFh    = fh.hora       ?? 20

  const esFds =
    dia === 0 || dia === 6 ||
    (dia === desdeDia && hora >= desdeHora)

  const esFuera = !esFds && hora >= horaFh

  return { esFds, esFuera }
}

export function recargoLabel(esFds, esFuera) {
  if (esFds)   return 'fin de semana'
  if (esFuera) return 'fuera de horario'
  return null
}

/**
 * Calcula el monto de recargo aplicable dado un evento y un tipo de servicio.
 * Fin de semana y fuera de horario son independientes pero mutuamente excluyentes
 * (un evento no puede ser ambos a la vez por la regla de prioridad).
 */
export function calcRecargo(startISO, serviceType, rules) {
  const { esFds, esFuera } = detectRecargos(startISO, rules)
  const montoFds   = esFds   && serviceType?.recargoFds?.activo   ? (serviceType.recargoFds.monto   ?? 0) : 0
  const montoFuera = esFuera && serviceType?.recargoFuera?.activo ? (serviceType.recargoFuera.monto ?? 0) : 0
  return { montoFds, montoFuera, total: montoFds + montoFuera, esFds, esFuera }
}
