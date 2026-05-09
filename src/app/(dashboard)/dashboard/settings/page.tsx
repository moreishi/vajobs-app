'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updateAccount } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export default function SettingsPage() {
  const [state, action, pending] = useActionState(updateAccount, { error: '' })

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-600 dark:text-green-400">Account updated successfully.</p>
          <Link href="/dashboard" className={buttonVariants()}>
            Back to Dashboard
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          <hr className="my-2" />

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Required to change password"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Leave blank to keep current"
            />
            <p className="mt-1 text-xs text-muted-foreground">Min 6 characters. Leave blank to keep current password.</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className={buttonVariants()}
            >
              {pending ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
