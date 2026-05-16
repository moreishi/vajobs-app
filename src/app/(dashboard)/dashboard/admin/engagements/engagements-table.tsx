'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FormattedDate } from '@/components/ui/formatted-date'
import { endEngagement } from '@/actions/admin-engagements'

type EngagementWithRelations = {
  id: string
  status: string
  startDate: Date
  endDate: Date | null
  createdAt: Date
  rate: number | null
  talent: { id: string; name: string | null; email: string }
  client: { id: string; name: string | null; email: string }
  jobPost: { id: string; title: string }
}

export function EngagementsTable({ engagements }: { engagements: EngagementWithRelations[] }) {
  const router = useRouter()
  const [pendingId, startEnd] = useTransition()

  function handleEnd(engagementId: string) {
    if (!confirm('End this engagement? This will mark it as ended.')) return
    startEnd(async () => {
      await endEngagement(engagementId)
      router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[750px] divide-y">
        <div className="grid grid-cols-10 gap-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="col-span-2">Talent</span>
          <span className="col-span-2">Client</span>
          <span className="col-span-2">Job</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Rate</span>
          <span className="col-span-1">Start</span>
          <span className="col-span-1"></span>
        </div>
        {engagements.map((e) => (
          <div key={e.id} className="grid grid-cols-10 gap-4 py-3 text-sm">
            <div className="col-span-2 truncate">
              {e.talent.name || e.talent.email}
            </div>
            <div className="col-span-2 truncate">
              {e.client.name || e.client.email}
            </div>
            <div className="col-span-2 truncate text-muted-foreground">
              {e.jobPost.title}
            </div>
            <div className="col-span-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                e.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {e.status}
              </span>
            </div>
            <div className="col-span-1 text-muted-foreground">
              {e.rate ? `$${e.rate}` : '-'}
            </div>
            <div className="col-span-1 text-muted-foreground">
              <FormattedDate date={e.startDate} />
            </div>
            <div className="col-span-1">
              {e.status === 'active' && (
                <button
                  onClick={() => handleEnd(e.id)}
                  disabled={pendingId === e.id}
                  className="text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  {pendingId === e.id ? '...' : 'End'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
