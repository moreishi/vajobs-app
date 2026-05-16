'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { retryFailedEmail } from '@/actions/admin'
import { RefreshCwIcon } from 'lucide-react'

export function RetryEmailButton({ emailLogId }: { emailLogId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      await retryFailedEmail(emailLogId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      <RefreshCwIcon className={`h-3 w-3 ${pending ? 'animate-spin' : ''}`} />
      Retry
    </button>
  )
}
