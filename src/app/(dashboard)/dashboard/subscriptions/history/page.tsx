import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function SubscriptionHistoryPage(props: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const searchParams = await props.searchParams
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const skip = (page - 1) * PAGE_SIZE

  const [subscriptions, total] = await Promise.all([
    prisma.clientSubscription.findMany({
      where: { userId: session.user.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.clientSubscription.count({ where: { userId: session.user.id } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <Link href="/dashboard/subscriptions" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Membership
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Subscription History</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions {total > 0 && <span className="text-sm font-normal text-muted-foreground">({total})</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No subscription history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[650px] divide-y">
                <div className="grid grid-cols-6 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Plan</span>
                  <span>Status</span>
                  <span>Period Start</span>
                  <span>Period End</span>
                  <span>Auto-Renew</span>
                  <span>Created</span>
                </div>
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="grid grid-cols-6 gap-4 py-3 text-sm items-center">
                    <span className="font-medium">{sub.plan.name}</span>
                    <span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : sub.status === 'cancelled'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {sub.status}
                      </span>
                    </span>
                    <span className="text-muted-foreground">{new Date(sub.currentPeriodStart).toLocaleDateString()}</span>
                    <span className="text-muted-foreground">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                    <span>{sub.autoRenew ? 'Yes' : 'No'}</span>
                    <span className="text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/subscriptions/history?page=${page - 1}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/subscriptions/history?page=${page + 1}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
