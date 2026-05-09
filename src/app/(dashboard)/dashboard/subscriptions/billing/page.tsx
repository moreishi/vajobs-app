import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { PROVIDER_LABELS } from '@/lib/payments/types'
import type { ProviderName } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function BillingPage(props: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const searchParams = await props.searchParams
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const skip = (page - 1) * PAGE_SIZE

  const [invoices, total] = await Promise.all([
    prisma.paymentOrder.findMany({
      where: {
        userId: session.user.id,
        type: 'subscription',
        status: 'completed',
      },
      include: { plan: true },
      orderBy: { completedAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.paymentOrder.count({
      where: {
        userId: session.user.id,
        type: 'subscription',
        status: 'completed',
      },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <Link href="/dashboard/subscriptions" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Membership
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Billing & Invoices</h1>

      {/* Summary */}
      {total > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{total}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${(invoices.reduce((sum, inv) => sum + inv.priceInCents, 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last Payment</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {invoices[0] ? new Date(invoices[0].completedAt!).toLocaleDateString() : '-'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices {total > 0 && <span className="text-sm font-normal text-muted-foreground">({total})</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No billing history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px] divide-y">
                <div className="grid grid-cols-6 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Date</span>
                  <span>Description</span>
                  <span>Amount</span>
                  <span>Provider</span>
                  <span>Status</span>
                  <span>Receipt</span>
                </div>
                {invoices.map((inv) => (
                  <div key={inv.id} className="grid grid-cols-6 gap-4 py-3 text-sm items-center">
                    <span className="text-muted-foreground">
                      {inv.completedAt ? new Date(inv.completedAt).toLocaleDateString() : '-'}
                    </span>
                    <span className="font-medium truncate">{inv.description || inv.plan?.name || 'Subscription'}</span>
                    <span className="font-medium">${(inv.priceInCents / 100).toFixed(2)}</span>
                    <span className="capitalize text-muted-foreground">
                      {PROVIDER_LABELS[inv.provider as ProviderName] || inv.provider}
                    </span>
                    <span>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Paid
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {inv.id.slice(0, 8)}...
                    </span>
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
                  href={`/dashboard/subscriptions/billing?page=${page - 1}`}
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
                  href={`/dashboard/subscriptions/billing?page=${page + 1}`}
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
