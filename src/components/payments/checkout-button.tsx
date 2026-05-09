'use client'

import { useActionState, useEffect } from 'react'
import { createConnectsCheckout } from '@/actions/payments'
import { CONNECT_PACKAGES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { PROVIDER_LABELS } from '@/lib/payments/types'

export function CheckoutButton({ providerName }: { providerName: string }) {
  const [state, action, pending] = useActionState(createConnectsCheckout, undefined)

  useEffect(() => {
    if (state?.redirectUrl) {
      window.location.href = state.redirectUrl
    }
  }, [state?.redirectUrl])

  if (state?.redirectUrl) {
    return (
      <p className="text-sm text-muted-foreground">
        Redirecting to {PROVIDER_LABELS[providerName as keyof typeof PROVIDER_LABELS] || providerName}...
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
        {pending ? 'Processing...' : `Purchase via ${PROVIDER_LABELS[providerName as keyof typeof PROVIDER_LABELS] || providerName}`}
      </Button>
    </form>
  )
}
