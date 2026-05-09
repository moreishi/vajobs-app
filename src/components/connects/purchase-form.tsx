'use client'

import { useActionState } from 'react'
import { purchaseConnects } from '@/actions/connects'
import { CONNECT_PACKAGES } from '@/lib/constants'
import { Button } from '@/components/ui/button'

export function PurchaseForm() {
  const [state, action, pending] = useActionState(purchaseConnects, undefined)

  if (state?.success) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">
        Connects purchased successfully! They have been added to your balance.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONNECT_PACKAGES.map((pkg) => (
          <label
            key={pkg.amount}
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-input p-4 text-center transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="amount"
              value={pkg.amount}
              defaultChecked={pkg.amount === 50}
              className="sr-only"
            />
            <span className="text-lg font-bold">{pkg.amount}</span>
            <span className="text-xs text-muted-foreground">connects</span>
            <span className="text-sm font-medium">${pkg.price}</span>
          </label>
        ))}
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Processing...' : 'Purchase'}
      </Button>
    </form>
  )
}
