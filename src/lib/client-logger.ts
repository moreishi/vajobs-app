const LOG_API = '/api/log'

export function logClientError(label: string, message: string, meta?: unknown) {
  fetch(LOG_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, message, meta: meta ? String(meta) : undefined }),
  }).catch(() => {
    // Can't log a logging failure — swallow it
  })
}
