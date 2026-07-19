// Mapa de alias → displayName canónico.
// El admin puede sobreescribir este mapa con tipos dinámicos desde Firestore.
let TYPE_MAP = {
  bs: 'Babysitter', babysitter: 'Babysitter',
  terapia: 'Terapia', taller: 'Taller',
}

// Llamado desde Admin.jsx al cargar los tipos desde Firestore.
// Recibe { alias: displayName, ... } y reemplaza el mapa estático.
export function setDynamicTypeMap(aliasToDisplay) {
  TYPE_MAP = aliasToDisplay
}

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeType(raw) {
  // Intentar con y sin tilde — el alias guardado puede diferir del texto del evento
  const key       = raw.toLowerCase()
  const keyNorm   = stripAccents(key)
  return TYPE_MAP[key] ?? TYPE_MAP[keyNorm] ?? (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase())
}

export function parseEvent(summary = '') {
  // Primera palabra no-espacio = tipo de servicio, el resto = nombre del paciente
  const match = summary.match(/^(\S+)[\s\-–—/:]+(.+)$/)
  if (!match) {
    return { type: null, typeName: 'Sin clasificar', patientName: summary, patientId: slugify(summary) }
  }
  const typeName = normalizeType(match[1].trim())
  return {
    type:        typeName,
    typeName,
    patientName: match[2].trim(),
    patientId:   slugify(match[2].trim()),
  }
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
