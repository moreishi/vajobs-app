import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getAlerts } from '@/actions/saved-search-alerts'
import { SavedSearchList } from '@/components/saved-searches/saved-search-list'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export const metadata = {
  title: 'Saved Searches - Talent Hub',
  description: 'Manage your saved search alerts',
}

export default async function SavedSearchesPage() {
  const session = await auth()
  if (!session?.user) return <p className="text-sm text-muted-foreground">Please log in to view saved searches.</p>

  const alerts = await getAlerts()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Saved Searches</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your saved search alerts and get notified when new results match.
          </p>
        </div>
        <Link href={ROUTES.DASHBOARD} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back to Dashboard
        </Link>
      </div>

      {alerts.length > 0 ? (
        <SavedSearchList alerts={alerts} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground">No saved searches yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Save a search from the{' '}
            <Link href="/jobs" className="text-primary underline">Jobs</Link>
            {' or '}
            <Link href="/talents" className="text-primary underline">Talents</Link>
            {' '}pages to get started.
          </p>
        </div>
      )}
    </div>
  )
}
