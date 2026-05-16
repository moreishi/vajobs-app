'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleMembershipAccess } from '@/actions/admin'

export function MembershipToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle() {
    startTransition(async () => {
      await toggleMembershipAccess()
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Membership Pages</p>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? 'VA Membership and Membership pages are visible and accessible'
            : 'VA Membership and Membership pages are hidden and blocked'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={pending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${enabled ? 'bg-green-500' : 'bg-muted'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}
