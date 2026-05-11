'use client'

import { useActionState } from 'react'
import { createVaPlan } from '@/actions/va-subscriptions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function VaPlanForm() {
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createVaPlan({
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        priceInCents: parseInt(formData.get('priceInCents') as string),
        features: formData.get('features') as string || '[]',
        badge: (formData.get('badge') as string) || undefined,
        sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      })
      return result.error || 'Plan created successfully!'
    },
    null,
  )

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input id="name" name="name" placeholder="e.g. Premium VA" required />
        </div>
        <div>
          <Label htmlFor="priceInCents">Price (cents)</Label>
          <Input id="priceInCents" name="priceInCents" type="number" min={1} placeholder="e.g. 1999" required />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="Brief description of the plan" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="badge">Badge</Label>
          <Input id="badge" name="badge" placeholder="e.g. Most Popular" />
        </div>
        <div>
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
        </div>
      </div>
      <div>
        <Label htmlFor="features">Features (JSON array)</Label>
        <Input id="features" name="features" placeholder='["Feature 1", "Feature 2"]' />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Plan'}
      </Button>
      {state && (
        <p className={`text-sm ${typeof state === 'string' && state.includes('error') ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
          {typeof state === 'string' ? state : 'Plan created!'}
        </p>
      )}
    </form>
  )
}
