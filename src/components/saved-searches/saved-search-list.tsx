'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BellIcon, BellOffIcon, Trash2Icon, SearchIcon, UserIcon } from 'lucide-react'
import { toggleAlert, deleteAlert } from '@/actions/saved-search-alerts'
import type { SavedSearchAlertData } from '@/actions/saved-search-alerts'

export function SavedSearchList({ alerts: initialAlerts }: { alerts: SavedSearchAlertData[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [optimisticAlerts, setOptimisticAlerts] = useOptimistic(initialAlerts)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleToggle(alertId: string, active: boolean) {
    startTransition(async () => {
      setOptimisticAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, active } : a))
      )
      await toggleAlert(alertId, active)
    })
  }

  async function handleDelete(alertId: string) {
    setDeleting(alertId)
    await deleteAlert(alertId)
    router.refresh()
  }

  const filterLabel = (filters: Record<string, string>, type: string) => {
    const parts: string[] = []
    if (filters.query) parts.push(`"${filters.query}"`)
    if (filters.type) parts.push(filters.type)
    if (filters.location) parts.push(filters.location)
    if (filters.skills) parts.push(`${filters.skills.split(',').length} skills`)
    if (filters.availability) parts.push(filters.availability)
    if (filters.rateMin || filters.rateMax) {
      parts.push(`rate ${filters.rateMin || '0'}-${filters.rateMax || '∞'}`)
    }
    if (filters.expMin || filters.expMax) {
      parts.push(`exp ${filters.expMin || '0'}-${filters.expMax || '∞'}yr`)
    }
    return parts.length > 0 ? parts.join(' · ') : 'All listings'
  }

  const typeIcon = (type: string) => {
    return type === 'talents' ? (
      <UserIcon className="h-4 w-4" />
    ) : (
      <SearchIcon className="h-4 w-4" />
    )
  }

  return (
    <div className="space-y-3">
      {optimisticAlerts.map((alert) => (
        <Card key={alert.id} className={alert.active ? '' : 'opacity-60'}>
          <CardContent className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {typeIcon(alert.type)}
                <p className="font-medium truncate">{alert.name}</p>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                  {alert.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filterLabel(alert.filters, alert.type)}
              </p>
              {alert.lastMatchedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last matched: {new Date(alert.lastMatchedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(alert.id, !alert.active)}
                title={alert.active ? 'Pause alert' : 'Activate alert'}
              >
                {alert.active ? (
                  <BellIcon className="h-4 w-4" />
                ) : (
                  <BellOffIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(alert.id)}
                disabled={deleting === alert.id}
                title="Delete alert"
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
