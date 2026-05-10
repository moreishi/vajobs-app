'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptProposal } from '@/actions/proposals'
import { Button } from '@/components/ui/button'

export function AcceptProposalButton({ applicationId }: { applicationId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleAccept() {
    if (!confirm('Accept this proposal? This will create an engagement and contract automatically.')) return
    setIsLoading(true)
    setError(null)

    const result = await acceptProposal(applicationId)
    if ('error' in result) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push(`/dashboard/engagements/${result.engagementId}`)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleAccept} disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? 'Creating Engagement...' : 'Accept Proposal & Create Contract'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
