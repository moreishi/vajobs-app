import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { NotificationPreferencesForm } from '@/components/settings/notification-preferences-form'

export const metadata = {
  title: 'Notification Preferences - Talent Hub',
  description: 'Manage your email notification preferences',
}

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <Link href="/dashboard/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Back to Settings
        </Link>
      </div>
      <NotificationPreferencesForm />
    </div>
  )
}
