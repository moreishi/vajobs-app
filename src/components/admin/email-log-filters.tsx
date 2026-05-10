'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchIcon } from 'lucide-react'

export function EmailLogFilters({
  currentStatus,
  currentType,
  currentSearch,
}: {
  currentStatus: string
  currentType: string
  currentSearch: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams()
    if (value) params.set(key, value)
    if (key !== 'search' && currentSearch) params.set('search', currentSearch)
    if (key !== 'status' && currentStatus && key !== 'status') params.set('status', currentStatus)
    if (key !== 'type' && currentType && key !== 'type') params.set('type', currentType)
    if (key === 'search') {
      if (currentStatus) params.set('status', currentStatus)
      if (currentType) params.set('type', currentType)
    }
    router.push(`/dashboard/admin/email-logs${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter('search', search)
  }

  function clearFilters() {
    setSearch('')
    router.push('/dashboard/admin/email-logs')
  }

  const hasFilters = !!(currentStatus || currentType || currentSearch)

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <button
            onClick={() => applyFilter('status', '')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${!currentStatus ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          <button
            onClick={() => applyFilter('status', 'sent')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${currentStatus === 'sent' ? 'bg-green-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Sent
          </button>
          <button
            onClick={() => applyFilter('status', 'failed')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${currentStatus === 'failed' ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Failed
          </button>
        </div>

        <select
          value={currentType}
          onChange={(e) => applyFilter('type', e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        >
          <option value="">All types</option>
          <option value="application_received">Application Received</option>
          <option value="status_updated">Status Updated</option>
          <option value="interview_scheduled">Interview Scheduled</option>
          <option value="interview_cancelled">Interview Cancelled</option>
          <option value="message_received">Message Received</option>
          <option value="review_received">Review Received</option>
          <option value="engagement_ended">Engagement Ended</option>
          <option value="connects_purchased">Connects Purchased</option>
          <option value="payment_completed">Payment Completed</option>
          <option value="subscription_cancelled">Subscription Cancelled</option>
          <option value="subscription_renewal">Subscription Renewal</option>
        </select>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 pl-7 text-xs"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">Search</Button>
        </form>

        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
