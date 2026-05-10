'use client'

import { useOptimistic, useTransition } from 'react'
import { updateNotificationPreference } from '@/actions/notification-preferences'

export function TogglePreference({ type, enabled }: { type: string; enabled: boolean }) {
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(enabled)
  const [, startTransition] = useTransition()

  function handleToggle() {
    const next = !optimisticEnabled
    startTransition(async () => {
      setOptimisticEnabled(next)
      await updateNotificationPreference(type, next)
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimisticEnabled}
      aria-label={`${optimisticEnabled ? 'Disable' : 'Enable'} email notifications`}
      onClick={handleToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        optimisticEnabled ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          optimisticEnabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
