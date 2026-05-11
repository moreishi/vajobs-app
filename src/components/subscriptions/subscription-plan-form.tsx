'use client'

import { useActionState } from 'react'
import { createPlan, updatePlan } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Plan {
  id: string
  name: string
  description: string | null
  durationMonths: number
  priceInCents: number
  connectsPerPeriod: number | null
  badge: string | null
  active: boolean
  sortOrder: number
}

export function SubscriptionPlanForm({ plan }: { plan?: Plan | null }) {
  const action = plan ? updatePlan.bind(null, plan.id) : createPlan
  const label = plan ? 'Update Plan' : 'Create Plan'

  return (
    <form action={action as any} className="space-y-4">
      <div>
        <Label htmlFor="name">Plan Name</Label>
        <Input id="name" name="name" defaultValue={plan?.name} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" defaultValue={plan?.description ?? ''} />
      </div>
      <div>
        <Label htmlFor="badge">Badge</Label>
        <Input id="badge" name="badge" placeholder="e.g. Most Popular" defaultValue={plan?.badge ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="durationMonths">Duration (months)</Label>
          <Input id="durationMonths" name="durationMonths" type="number" min={1} defaultValue={plan?.durationMonths ?? 1} required />
        </div>
        <div>
          <Label htmlFor="priceInCents">Price (cents)</Label>
          <Input id="priceInCents" name="priceInCents" type="number" min={1} defaultValue={plan?.priceInCents} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="connectsPerPeriod">Worker Contacts / Month</Label>
          <Input id="connectsPerPeriod" name="connectsPerPeriod" type="number" min={0} placeholder="e.g. 75" defaultValue={plan?.connectsPerPeriod ?? ''} />
        </div>
        <div>
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} />
        </div>
      </div>
      <Button type="submit">{label}</Button>
    </form>
  )
}
