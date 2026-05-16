'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { processAllPending } from '@/actions/admin'
import { buttonVariants } from '@/components/ui/button'
import { SendIcon } from 'lucide-react'

export function ProcessPendingButton() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      await processAllPending()
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      <SendIcon className={`mr-1.5 h-4 w-4 ${pending ? 'animate-pulse' : ''}`} />
      {pending ? 'Processing...' : 'Process Pending'}
    </button>
  )
}
