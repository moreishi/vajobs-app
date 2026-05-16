import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getAllEngagements } from '@/actions/admin-engagements'
import { EngagementsTable } from './engagements-table'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['', 'active', 'ended']

export default async function AdminEngagementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const params = await searchParams
  const statusParam = VALID_STATUSES.includes(params.status || '') ? params.status || '' : ''
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const [{ engagements, total }, stats] = await Promise.all([
    getAllEngagements({ status: statusParam, page: currentPage }),
    prisma.engagement.groupBy({ by: ['status'], _count: true }),
  ])

  const totalPages = Math.ceil(total / 20)
  const statusMap: Record<string, number> = {}
  for (const s of stats) statusMap[s.status] = s._count
  const totalEngagements = stats.reduce((sum, s) => sum + s._count, 0)

  return (
    <>
      <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Admin Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Engagements</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalEngagements}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{statusMap['active'] ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ended</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{statusMap['ended'] ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Engagements ({total})</CardTitle>
            <div className="flex gap-2">
              {['', 'active', 'ended'].map((s) => (
                <Link
                  key={s}
                  href={`/dashboard/admin/engagements${s ? `?status=${s}` : ''}`}
                  className={buttonVariants({
                    variant: statusParam === s ? 'default' : 'outline',
                    size: 'sm',
                  })}
                >
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {engagements.length > 0 ? (
            <EngagementsTable engagements={engagements} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No engagements found.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
              <p className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/dashboard/admin/engagements?${new URLSearchParams({ ...(statusParam ? { status: statusParam } : {}), page: String(currentPage - 1) }).toString()}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/dashboard/admin/engagements?${new URLSearchParams({ ...(statusParam ? { status: statusParam } : {}), page: String(currentPage + 1) }).toString()}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
