'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createMilestone, completeMilestone, approveMilestone, rejectMilestone } from '@/actions/milestones'
import { ListChecksIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, CheckIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { MilestoneData } from '@/actions/milestones'

type Props = {
  contractId: string
  contractActive: boolean
  milestones: MilestoneData[]
  isTalent: boolean
  isClient: boolean
}

export function MilestoneSection({ contractId, contractActive, milestones: initialMilestones, isTalent, isClient }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [milestones, setMilestones] = useState<MilestoneData[]>(initialMilestones)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) { toast.error('Amount must be positive'); return }

    setIsLoading(true)
    const res = await createMilestone({
      contractId,
      title: title.trim(),
      description: description.trim() || undefined,
      amount: amountNum,
      dueDate: dueDate.trim() || undefined,
    })
    setIsLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Milestone created')
      setMilestones((prev) => [...prev, res.data as MilestoneData])
      setShowForm(false)
      setTitle('')
      setDescription('')
      setAmount('')
      setDueDate('')
      router.refresh()
    }
  }

  async function handleComplete(id: string) {
    setIsLoading(true)
    const res = await completeMilestone(id)
    setIsLoading(false)
    if ('error' in res) { toast.error(res.error) }
    else {
      toast.success('Milestone completed')
      setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, status: 'completed', completedAt: new Date() } : m))
      router.refresh()
    }
  }

  async function handleApprove(id: string) {
    setIsLoading(true)
    const res = await approveMilestone(id)
    setIsLoading(false)
    if ('error' in res) { toast.error(res.error) }
    else {
      toast.success('Milestone approved')
      setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, status: 'approved', approvedAt: new Date() } : m))
      router.refresh()
    }
  }

  async function handleReject(id: string) {
    setIsLoading(true)
    const res = await rejectMilestone(id)
    setIsLoading(false)
    if ('error' in res) { toast.error(res.error) }
    else {
      toast.success('Milestone needs revisions')
      setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, status: 'pending', completedAt: null } : m))
      router.refresh()
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
  const approvedAmount = milestones.filter((m) => m.status === 'approved').reduce((sum, m) => sum + m.amount, 0)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecksIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Milestones</CardTitle>
            {milestones.length > 0 && (
              <span className="text-xs text-muted-foreground">({milestones.length})</span>
            )}
          </div>
          {isOpen ? <ChevronUpIcon className="h-4 w-4 text-muted-foreground" /> : <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 border-t pt-4">
          {!contractId && (
            <p className="text-xs text-muted-foreground">Create a contract before adding milestones.</p>
          )}

          {contractId && contractActive && (
            <>
              {!showForm ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(true)}>
                  <PlusIcon className="mr-1 h-3 w-3" /> Add Milestone
                </Button>
              ) : (
                <form onSubmit={handleCreate} className="space-y-3 rounded-md border p-3">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design homepage" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Description (optional)</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deliverables, acceptance criteria..." className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Amount ($)</Label>
                      <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Due Date (optional)</Label>
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Milestone'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          {contractId && !contractActive && (
            <p className="text-xs text-muted-foreground">Milestones are available for active contracts.</p>
          )}

          {milestones.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Total: <strong>${totalAmount.toFixed(2)}</strong></span>
                <span>Approved: <strong>${approvedAmount.toFixed(2)}</strong></span>
              </div>

              <div className="space-y-2">
                {milestones.map((m) => (
                  <div key={m.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{m.title}</p>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                        )}
                      </div>
                      <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(m.status)}`}>
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>${m.amount.toFixed(2)}</span>
                      {m.dueDate && <span>Due: {new Date(m.dueDate).toLocaleDateString()}</span>}
                      {m.completedAt && <span>Completed: {new Date(m.completedAt).toLocaleDateString()}</span>}
                      {m.approvedAt && <span>Approved: {new Date(m.approvedAt).toLocaleDateString()}</span>}
                    </div>

                    {contractActive && (
                      <div className="mt-2 flex gap-1.5">
                        {m.status === 'pending' && isTalent && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleComplete(m.id)} disabled={isLoading}>
                            <CheckIcon className="mr-1 h-3 w-3" /> Mark Complete
                          </Button>
                        )}
                        {m.status === 'completed' && isClient && (
                          <>
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleApprove(m.id)} disabled={isLoading}>
                              <CheckIcon className="mr-1 h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReject(m.id)} disabled={isLoading}>
                              <XIcon className="mr-1 h-3 w-3" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {milestones.length === 0 && contractId && (
            <p className="text-xs text-muted-foreground">
              No milestones yet. Add them to track progress and deliverables.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
