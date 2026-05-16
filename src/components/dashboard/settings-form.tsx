'use client'

import { useEffect, useRef, useState, useActionState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { updateAccount } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

const TIMEZONES = [
  'Asia/Manila',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Taipei',
  'Pacific/Auckland',
  'Australia/Sydney',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Lagos',
  'UTC',
]

interface SettingsFormProps {
  name: string | null
  email: string
  timezone: string
}

export function SettingsForm({ name, email, timezone }: SettingsFormProps) {
  const { update } = useSession()
  const [state, action, pending] = useActionState(updateAccount, { error: '' })
  const [selectedTz, setSelectedTz] = useState(timezone)
  const updatedRef = useRef(false)

  useEffect(() => {
    if (state.success && !updatedRef.current) {
      updatedRef.current = true
      update({ timezone: selectedTz })
    }
  }, [state.success, selectedTz, update])

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
              defaultValue={name ?? ''}
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
              value={email}
              disabled
              className="flex h-9 w-full cursor-not-allowed rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground shadow-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium mb-1">Timezone</label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={timezone}
              onChange={(e) => setSelectedTz(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">All dates will be displayed in this timezone. Default: Asia/Manila (GMT+8).</p>
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
        <div className="mt-6 border-t pt-6">
          <Link
            href="/dashboard/settings/notifications"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Notification Preferences
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
