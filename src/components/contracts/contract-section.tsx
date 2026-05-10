'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createContract, signContract, terminateContract } from '@/actions/contracts'
import { FileTextIcon, CheckIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { ContractData } from '@/actions/contracts'

type Props = {
  engagementId: string
  contract: ContractData | null
  isClient: boolean
  isTalent: boolean
}

export function ContractSection({ engagementId, contract: initialContract, isClient, isTalent }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [contract, setContract] = useState<ContractData | null>(initialContract)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [terms, setTerms] = useState('')
  const [rate, setRate] = useState('')
  const [rateType, setRateType] = useState('fixed')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !terms.trim() || !rate.trim() || !startDate.trim()) {
      toast.error('Title, terms, rate, and start date are required')
      return
    }
    const rateNum = parseFloat(rate)
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error('Rate must be a positive number')
      return
    }
    setIsLoading(true)
    const res = await createContract({
      engagementId,
      title: title.trim(),
      terms: terms.trim(),
      rate: rateNum,
      rateType,
      startDate,
      endDate: endDate.trim() || undefined,
    })
    setIsLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Contract created')
      setContract(res.data as unknown as ContractData)
      setShowForm(false)
      router.refresh()
    }
  }

  async function handleSign() {
    if (!contract) return
    setIsLoading(true)
    const res = await signContract(contract.id)
    setIsLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Contract signed')
      setContract((prev) => prev ? { ...prev, status: 'active', signedAt: new Date() } : null)
      router.refresh()
    }
  }

  async function handleTerminate() {
    if (!contract || !confirm('Are you sure you want to terminate this contract?')) return
    setIsLoading(true)
    const res = await terminateContract(contract.id)
    setIsLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Contract terminated')
      setContract((prev) => prev ? { ...prev, status: 'terminated' } : null)
      router.refresh()
    }
  }

  const canSign = contract?.status === 'draft'
  const canTerminate = contract?.status === 'active' && isClient

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Contract</CardTitle>
            {contract && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                contract.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                contract.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </span>
            )}
          </div>
          {isOpen ? <ChevronUpIcon className="h-4 w-4 text-muted-foreground" /> : <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 border-t pt-4">
          {!contract && isClient && !showForm && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Create a formal contract to define the terms of this engagement.
              </p>
              <Button type="button" size="sm" onClick={() => setShowForm(true)}>
                Create Contract
              </Button>
            </div>
          )}

          {!contract && !isClient && (
            <p className="text-xs text-muted-foreground">
              No contract has been created yet. The client will create one when ready.
            </p>
          )}

          {showForm && (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Web Development Contract" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Terms & Scope of Work</Label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                  placeholder="Describe the work, deliverables, payment terms, etc."
                  className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Rate</Label>
                  <Input type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Rate Type</Label>
                  <select value={rateType} onChange={(e) => setRateType(e.target.value)} className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">End Date (optional)</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Contract'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {contract && (
            <div className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Title</span>
                  <p className="font-medium">{contract.title}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Terms</span>
                  <p className="whitespace-pre-wrap text-muted-foreground">{contract.terms}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Rate</span>
                    <p className="font-medium">${contract.rate.toFixed(2)} / {contract.rateType === 'hourly' ? 'hr' : 'fixed'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Start Date</span>
                    <p className="font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
                  </div>
                  {contract.endDate && (
                    <div>
                      <span className="text-xs text-muted-foreground">End Date</span>
                      <p className="font-medium">{new Date(contract.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {contract.signedAt && (
                    <div>
                      <span className="text-xs text-muted-foreground">Signed</span>
                      <p className="font-medium">{new Date(contract.signedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {canSign && (
                  <Button size="sm" onClick={handleSign} disabled={isLoading}>
                    <CheckIcon className="mr-1 h-3 w-3" />
                    {isLoading ? 'Signing...' : 'Sign Contract'}
                  </Button>
                )}
                {canTerminate && (
                  <Button size="sm" variant="destructive" onClick={handleTerminate} disabled={isLoading}>
                    <XIcon className="mr-1 h-3 w-3" />
                    {isLoading ? 'Terminating...' : 'Terminate Contract'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
