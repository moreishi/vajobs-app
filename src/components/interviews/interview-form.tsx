'use client'

import { useState } from 'react'
import { scheduleInterview } from '@/actions/applications'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function InterviewForm({ applicationId }: { applicationId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await scheduleInterview(applicationId, formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schedule Interview</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="scheduledAt" className="mb-1 block text-sm font-medium">
              Date & Time
            </label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="duration" className="mb-1 block text-sm font-medium">
              Duration (minutes)
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              defaultValue={60}
              min={15}
              max={480}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="meetingLink" className="mb-1 block text-sm font-medium">
              Meeting Link (optional)
            </label>
            <input
              id="meetingLink"
              name="meetingLink"
              type="url"
              placeholder="https://meet.google.com/..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any additional information..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Scheduling...' : 'Schedule Interview'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
