const DEFAULT_MS = 4000

export function withTimeout(promise, ms = DEFAULT_MS, label = 'operación') {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout: ${label} tardó más de ${ms / 1000}s`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
