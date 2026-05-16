'use client'

import { useEffect } from 'react'

export function TimezoneSetter({ timezone }: { timezone: string }) {
  useEffect(() => {
    document.documentElement.dataset.timezone = timezone
  }, [timezone])
  return null
}
