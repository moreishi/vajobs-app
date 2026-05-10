'use client'

import { useTransition } from 'react'
import { toggleVerification } from '@/actions/admin'
import { BadgeCheckIcon } from 'lucide-react'

export function VerifyToggle({
  userId,
  verified,
  hasProfile,
}: {
  userId: string
  verified: boolean
  hasProfile: boolean
}) {
  const [, startTransition] = useTransition()

  if (!hasProfile) return null

  function handleToggle() {
    startTransition(async () => {
      await toggleVerification(userId, !verified)
    })
  }

  return (
    <button
      onClick={handleToggle}
      title={verified ? 'Remove verification' : 'Verify talent'}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
        verified
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      <BadgeCheckIcon className="h-3.5 w-3.5" />
      {verified ? 'Verified' : 'Verify'}
    </button>
  )
}
