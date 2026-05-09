'use client'

import { useActionState } from 'react'
import { saveJob, unsaveJob } from '@/actions/saved-jobs'
import { buttonVariants } from '@/components/ui/button'

export function SaveButton({ jobId, isSaved }: { jobId: string; isSaved: boolean }) {
  const action = isSaved
    ? async () => { await unsaveJob(jobId) }
    : async () => { await saveJob(jobId) }

  const [, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className={buttonVariants({ variant: isSaved ? 'secondary' : 'outline', size: 'sm' })}
      >
        {pending ? '...' : isSaved ? 'Saved' : 'Save Job'}
      </button>
    </form>
  )
}
