'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatus } from '@/actions/applications'
import { Button } from '@/components/ui/button'

export function RejectProposalButton({ applicationId }: { applicationId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleReject() {
    if (!confirm('Reject this proposal? The applicant will be notified.')) return
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('status', 'rejected')
    const result = await updateApplicationStatus(applicationId, formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleReject} disabled={isLoading} variant="outline" size="sm" className="w-full sm:w-auto text-destructive">
        {isLoading ? 'Rejecting...' : 'Reject'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
