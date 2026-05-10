'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProposal } from '@/actions/proposals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2Icon } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  applicationId: string
  initialBidAmount: number | null
  initialBidType: string
  initialTimeline: number | null
  initialApproach: string | null
}

export function EditProposalForm({
  applicationId,
  initialBidAmount,
  initialBidType,
  initialTimeline,
  initialApproach,
}: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bidAmount, setBidAmount] = useState(initialBidAmount?.toString() || '')
  const [bidType, setBidType] = useState(initialBidType)
  const [timeline, setTimeline] = useState(initialTimeline?.toString() || '')
  const [approach, setApproach] = useState(initialApproach || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.set('bidAmount', bidAmount)
    formData.set('bidType', bidType)
    formData.set('timeline', timeline)
    formData.set('approach', approach)

    const result = await updateProposal(applicationId, formData)
    setIsLoading(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Proposal updated')
      setIsEditing(false)
      router.refresh()
    }
  }

  function handleCancel() {
    setBidAmount(initialBidAmount?.toString() || '')
    setBidType(initialBidType)
    setTimeline(initialTimeline?.toString() || '')
    setApproach(initialApproach || '')
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-7 text-xs">
        <Edit2Icon className="mr-1 h-3 w-3" /> Edit Proposal
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">Revise Your Proposal</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Bid Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Type</Label>
          <select
            value={bidType}
            onChange={(e) => setBidType(e.target.value)}
            className="mt-1 h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="fixed">Fixed Price</option>
            <option value="hourly">Hourly Rate</option>
          </select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Timeline (days)</Label>
        <Input
          type="number"
          min="1"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. 30"
          className="mt-1 h-8 text-sm"
        />
      </div>

      <div>
        <Label className="text-xs">Approach</Label>
        <textarea
          value={approach}
          onChange={(e) => setApproach(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          placeholder="Describe your approach to the work..."
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
