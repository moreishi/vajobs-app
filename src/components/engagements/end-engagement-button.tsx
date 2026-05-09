'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { endEngagement } from '@/actions/engagements'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function EndEngagementButton({ engagementId }: { engagementId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleEnd() {
    if (!confirm('Are you sure you want to end this engagement?')) return
    setIsLoading(true)
    setError(null)

    const result = await endEngagement(engagementId)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        <Button variant="destructive" onClick={handleEnd} disabled={isLoading}>
          {isLoading ? 'Ending...' : 'End Engagement'}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
