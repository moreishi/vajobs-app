'use client'

import { useState } from 'react'
import { cancelInterview } from '@/actions/applications'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { Interview } from '@/types'

export function InterviewDetails({ interview, isClient }: { interview: Interview; isClient: boolean }) {
  const [error, setError] = useState<string | null>(null)

  async function handleCancel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!confirm('Cancel this interview?')) return
    setError(null)
    const result = await cancelInterview(interview.applicationId)
    if (result?.error) setError(result.error)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Interview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Date</span>
            <p className="font-medium">
              {new Date(interview.scheduledAt).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Time</span>
            <p className="font-medium">
              {new Date(interview.scheduledAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {interview.duration && (
            <div>
              <span className="text-xs text-muted-foreground">Duration</span>
              <p className="font-medium">{interview.duration} minutes</p>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <p className="font-medium capitalize">{interview.status}</p>
          </div>
        </div>

        {interview.meetingLink && (
          <div>
            <span className="text-xs text-muted-foreground">Meeting Link</span>
            <p>
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                {interview.meetingLink}
              </a>
            </p>
          </div>
        )}

        {interview.notes && (
          <div>
            <span className="text-xs text-muted-foreground">Notes</span>
            <p className="whitespace-pre-line text-sm">{interview.notes}</p>
          </div>
        )}

        {isClient && interview.status === 'scheduled' && (
          <form onSubmit={handleCancel}>
            <button type="submit" className={buttonVariants({ variant: 'destructive', size: 'sm' })}>
              Cancel Interview
            </button>
          </form>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
