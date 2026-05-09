'use client'

import { useState } from 'react'
import { withdrawApplication } from '@/actions/applications'
import { buttonVariants } from '@/components/ui/button'

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!confirm('Are you sure you want to withdraw this application?')) return

    setError(null)
    const result = await withdrawApplication(applicationId)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" className={buttonVariants({ variant: 'destructive', size: 'sm' })}>
        Withdraw Application
      </button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </form>
  )
}
