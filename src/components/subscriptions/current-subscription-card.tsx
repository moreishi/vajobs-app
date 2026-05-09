'use client'

import { useActionState } from 'react'
import { cancelSubscription, toggleAutoRenew } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  autoRenew: boolean
  cancelledAt: string | null
  plan: {
    id: string
    name: string
    priceInCents: number
    connectsPerPeriod: number | null
  }
}

export function CurrentSubscriptionCard({ subscription }: { subscription: Subscription | null }) {
  const [cancelState, cancelAction, cancelPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | undefined, formData: FormData) => {
      const id = formData.get('subscriptionId') as string
      return cancelSubscription(id)
    },
    undefined,
  )

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>You don&apos;t have an active subscription. Choose a plan below to get started.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const periodEnd = new Date(subscription.currentPeriodEnd)
  const daysLeft = Math.ceil((periodEnd.getTime() - Date.now()) / 86400000)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{subscription.plan.name} Plan</CardTitle>
        <CardDescription>
          {subscription.status === 'cancelled' ? 'Cancelled — access until period ends' : 'Active'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className={`text-sm font-medium capitalize ${subscription.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {subscription.status}
          </span>
        </div>
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-sm text-muted-foreground">Period End</span>
          <span className="text-sm font-medium">
            {periodEnd.toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft} days left` : 'expiring'})
          </span>
        </div>
        {subscription.plan.connectsPerPeriod && (
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground">Monthly Connects</span>
            <span className="text-sm font-medium">{subscription.plan.connectsPerPeriod}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Auto-Renew</span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              defaultChecked={subscription.autoRenew}
              onChange={async (e) => {
                await toggleAutoRenew(subscription.id, e.target.checked)
              }}
              className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
          </label>
        </div>
      </CardContent>
      {subscription.status === 'active' && (
        <CardFooter className="flex-col items-start gap-2">
          {cancelState?.error && (
            <p className="text-sm text-destructive">{cancelState.error}</p>
          )}
          <form action={cancelAction}>
            <input type="hidden" name="subscriptionId" value={subscription.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={cancelPending}
            >
              {cancelPending ? 'Processing...' : 'Cancel Subscription'}
            </Button>
          </form>
        </CardFooter>
      )}
    </Card>
  )
}
