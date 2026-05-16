'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createInvoice, markInvoicePaid } from '@/actions/invoices'
import { DollarSignIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentButton } from '@/components/invoices/payment-button'
import type { InvoiceData } from '@/actions/invoices'

type Props = {
  engagementId: string
  contractId: string | null
  contractActive: boolean
  invoices: InvoiceData[]
  userId: string
  isTalent: boolean
}

export function InvoiceSection({ engagementId, contractId, contractActive, invoices: initialInvoices, userId, isTalent }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!contractId) { toast.error('No active contract'); return }
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Amount must be a positive number')
      return
    }
    setIsLoading(true)
    const res = await createInvoice({
      contractId,
      engagementId,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      dueDate: dueDate.trim() || undefined,
    })
    setIsLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Invoice created')
      setInvoices((prev) => [res.data as InvoiceData, ...prev])
      setShowForm(false)
      setAmount('')
      setDescription('')
      setDueDate('')
      router.refresh()
    }
  }

  async function handleMarkPaid(invoiceId: string) {
    setIsLoading(true)
    const res = await markInvoicePaid(invoiceId)
    setIsLoading(false)
    if ('error' in res) {
      toast.error(res.error)
    } else {
      toast.success('Invoice marked as paid')
      setInvoices((prev) => prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'paid', paidAt: new Date() } : inv
      ))
      router.refresh()
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSignIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Invoices</CardTitle>
            {invoices.length > 0 && (
              <span className="text-xs text-muted-foreground">({invoices.length})</span>
            )}
          </div>
          {isOpen ? <ChevronUpIcon className="h-4 w-4 text-muted-foreground" /> : <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 border-t pt-4">
          {!contractId && (
            <p className="text-xs text-muted-foreground">
              Create a contract before sending invoices.
            </p>
          )}

          {contractId && contractActive && isTalent && (
            <>
              {!showForm ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(true)}>
                  <PlusIcon className="mr-1 h-3 w-3" /> Create Invoice
                </Button>
              ) : (
                <form onSubmit={handleCreate} className="space-y-3 rounded-md border p-3">
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
                  <div>
                    <Label className="text-xs">Description (optional)</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Milestone 1 payment" className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Invoice'}
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
            <p className="text-xs text-muted-foreground">
              Invoices are only available for active contracts.
            </p>
          )}

          {invoices.length === 0 && contractId && (
            <p className="text-xs text-muted-foreground">
              No invoices yet. Create one to bill for work completed.
            </p>
          )}

          {invoices.length > 0 && (
            <div className="space-y-2">
              {invoices.map((inv) => {
                const isPayer = inv.toId === userId
                const isSender = inv.fromId === userId
                return (
                  <div key={inv.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">${inv.amount.toFixed(2)}</p>
                        {inv.description && (
                          <p className="text-xs text-muted-foreground">{inv.description}</p>
                        )}
                      </div>
                      <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(inv.status)}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>From: {isSender ? 'You' : 'Other'}</span>
                      <span>To: {isPayer ? 'You' : 'Other'}</span>
                      {inv.dueDate && <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>}
                      {inv.paidAt && <span>Paid: {new Date(inv.paidAt).toLocaleDateString()}</span>}
                    </div>
                    <div className="mt-2 flex gap-2">
                      {inv.status === 'pending' && (isPayer || isSender) && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkPaid(inv.id)} disabled={isLoading}>
                          <CheckIcon className="mr-1 h-3 w-3" /> Mark as Paid
                        </Button>
                      )}
                      {inv.status === 'pending' && isPayer && (
                        <PaymentButton invoiceId={inv.id} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
