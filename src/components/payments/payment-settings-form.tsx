'use client'

import { useActionState } from 'react'
import { updateActiveProvider } from '@/actions/admin-payments'
import { PROVIDER_NAMES, PROVIDER_LABELS } from '@/lib/payments/types'
import { Button } from '@/components/ui/button'

export function PaymentSettingsForm({ currentProvider }: { currentProvider: string }) {
  const [state, action, pending] = useActionState(updateActiveProvider, undefined)

  return (
    <form action={action} className="space-y-4">
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Payment provider updated successfully.
        </p>
      )}
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="space-y-2">
        {PROVIDER_NAMES.map((name) => (
          <label
            key={name}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-3 transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="provider"
              value={name}
              defaultChecked={name === currentProvider}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">{PROVIDER_LABELS[name]}</span>
          </label>
        ))}
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
