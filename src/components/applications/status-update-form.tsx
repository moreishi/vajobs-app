'use client'

import { useState } from 'react'
import { updateApplicationStatus } from '@/actions/applications'
import { Button } from '@/components/ui/button'
import type { ApplicationStatus } from '@/types'

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'interview', label: 'Interview' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

export function StatusUpdateForm({ applicationId, currentStatus }: { applicationId: string; currentStatus: ApplicationStatus }) {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateApplicationStatus(applicationId, formData)

    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm">
        Update
      </Button>
    </form>
  )
}
