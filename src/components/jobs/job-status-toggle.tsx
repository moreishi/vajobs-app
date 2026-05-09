'use client'

import { useFormStatus } from 'react-dom'
import { updateJobStatus } from '@/actions/jobs'
import { buttonVariants } from '@/components/ui/button'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
      {pending ? pendingLabel : label}
    </button>
  )
}

export function JobStatusToggle({ jobId, currentStatus }: { jobId: string; currentStatus: 'open' | 'closed' }) {
  const action = async (formData: FormData) => {
    await updateJobStatus(jobId, formData)
  }

  return (
    <form action={action}>
      <input type="hidden" name="status" value={currentStatus === 'open' ? 'closed' : 'open'} />
      <SubmitButton
        label={currentStatus === 'open' ? 'Close' : 'Reopen'}
        pendingLabel="..."
      />
    </form>
  )
}
