'use client'

import { formatDateShort, formatDateTime, formatDateRelative } from '@/lib/dates'

type Props = {
  date: Date | string
  timezone?: string | null
  type?: 'date' | 'datetime' | 'relative'
}

export function FormattedDate({ date, timezone, type = 'date' }: Props) {
  const tz = timezone || getDataTimezone()

  switch (type) {
    case 'datetime':
      return <>{formatDateTime(date, tz)}</>
    case 'relative':
      return <>{formatDateRelative(date, tz)}</>
    default:
      return <>{formatDateShort(date, tz)}</>
  }
}

function getDataTimezone(): string {
  if (typeof document === 'undefined') return 'Asia/Manila'
  return document.documentElement.dataset.timezone || 'Asia/Manila'
}
