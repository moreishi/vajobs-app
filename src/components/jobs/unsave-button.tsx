'use client'

import { useActionState } from 'react'
import { unsaveJob } from '@/actions/saved-jobs'
import { buttonVariants } from '@/components/ui/button'

export function UnsaveButton({ jobId }: { jobId: string }) {
  const action = async () => { await unsaveJob(jobId) }
  const [, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        {pending ? '...' : 'Unsave'}
      </button>
    </form>
  )
}
