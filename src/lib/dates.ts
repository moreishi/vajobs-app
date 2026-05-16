const DEFAULT_TZ = 'Asia/Manila'

export function formatDate(
  date: Date | string,
  timezone?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const tz = timezone || DEFAULT_TZ
  return d.toLocaleDateString(undefined, {
    timeZone: tz,
    ...options,
  })
}

export function formatDateTime(
  date: Date | string,
  timezone?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const tz = timezone || DEFAULT_TZ
  return d.toLocaleString(undefined, {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

export function formatDateShort(
  date: Date | string,
  timezone?: string | null,
): string {
  return formatDate(date, timezone, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateRelative(
  date: Date | string,
  timezone?: string | null,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const tz = timezone || DEFAULT_TZ

  const now = new Date()
  const nowTz = new Date(now.toLocaleString('en-US', { timeZone: tz }))
  const dateTz = new Date(d.toLocaleString('en-US', { timeZone: tz }))

  const diffMs = nowTz.getTime() - dateTz.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateShort(date, timezone)
}
