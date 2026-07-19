export function parseEvent(summary = '') {
  // Acepta: espacio solo "BS María", guión "BS - María", slash "BS/María", etc.
  const match = summary.match(/^(BS|Babysitter|Terapia|Taller)[\s\-–—/:]+(.+)$/i)
  if (!match) {
    return {
      type: null,
      typeName: 'Sin clasificar',
      patientName: summary,
      patientId: slugify(summary),
    }
  }
  const typeMap = {
    bs: 'Babysitter',
    babysitter: 'Babysitter',
    terapia: 'Terapia',
    taller: 'Taller',
  }
  const key = match[1].toLowerCase()
  return {
    type: typeMap[key] ?? match[1],
    typeName: typeMap[key] ?? match[1],
    patientName: match[2].trim(),
    patientId: slugify(match[2].trim()),
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
