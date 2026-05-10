'use client'

import { useState } from 'react'
import { applyToJob } from '@/actions/applications'
import { Button } from '@/components/ui/button'

export function ApplyForm({ jobId, connects = 0 }: { jobId: string; connects?: number }) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [bid, setBid] = useState(1)
  const [bidAmount, setBidAmount] = useState('')
  const [bidType, setBidType] = useState('fixed')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await applyToJob(jobId, formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
        <span className="font-medium">{connects}</span> connects available
      </div>

      <div className="space-y-2">
        <label htmlFor="biddingConnects" className="text-sm font-medium">
          Bid connects: <span className="font-bold">{bid}</span>
        </label>
        <input
          id="biddingConnects"
          name="biddingConnects"
          type="range"
          min={1}
          max={10}
          value={bid}
          onChange={(e) => setBid(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 (low priority)</span>
          <span>10 (highest priority)</span>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proposal</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="bidAmount" className="text-sm font-medium">Bid Amount</label>
            <input
              id="bidAmount"
              name="bidAmount"
              type="number"
              step="0.01"
              min="0"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="bidType" className="text-sm font-medium">Type</label>
            <select
              id="bidType"
              name="bidType"
              value={bidType}
              onChange={(e) => setBidType(e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly Rate</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="timeline" className="text-sm font-medium">Timeline (days)</label>
          <input
            id="timeline"
            name="timeline"
            type="number"
            min="1"
            placeholder="e.g. 30"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="approach" className="text-sm font-medium">Approach</label>
          <textarea
            id="approach"
            name="approach"
            rows={3}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Describe how you'll approach the work, your process, and key deliverables..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="coverLetter" className="text-sm font-medium">
          Cover Letter <span className="text-xs text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="coverLetter"
          name="coverLetter"
          rows={4}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          placeholder="Tell the client why you'd be a great fit..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isLoading || connects < bid} className="w-full sm:w-auto">
        {isLoading ? 'Submitting Proposal...' : connects < bid ? 'Not enough connects' : `Submit Proposal (${bid} connects)`}
      </Button>
    </form>
  )
}
