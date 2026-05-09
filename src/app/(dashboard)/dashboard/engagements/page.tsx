import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { EngagementStatus } from '@/types'

export const dynamic = 'force-dynamic'

export default async function EngagementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { status } = await searchParams
  const role = session.user.role
  const isTalent = role === 'talent'
  if (role !== 'talent' && role !== 'client' && role !== 'admin') redirect('/dashboard')

  const activeTab: EngagementStatus = status === 'ended' ? 'ended' : 'active'

  const where = isTalent
    ? { talentId: session.user.id, status: activeTab }
    : { clientId: session.user.id, status: activeTab }

  const engagements = await prisma.engagement.findMany({
    where,
    include: {
      jobPost: { select: { id: true, title: true } },
      talent: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">
        {isTalent ? 'My Engagements' : 'Hired Talents'}
      </h1>

      <div className="mb-6 flex gap-2">
        <Link
          href="/dashboard/engagements?status=active"
          className={buttonVariants({ variant: activeTab === 'active' ? 'default' : 'outline', size: 'sm' })}
        >
          Active
        </Link>
        <Link
          href="/dashboard/engagements?status=ended"
          className={buttonVariants({ variant: activeTab === 'ended' ? 'default' : 'outline', size: 'sm' })}
        >
          Ended
        </Link>
      </div>

      {engagements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg text-muted-foreground">
            {activeTab === 'active'
              ? 'No active engagements.'
              : 'No ended engagements.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTalent ? (
              <Link href="/jobs" className="text-primary underline">Browse open positions</Link>
            ) : (
              'When you hire talents, they will appear here.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {engagements.map((eng) => (
            <Link key={eng.id} href={`/dashboard/engagements/${eng.id}`} className="block transition-all hover:opacity-80">
              <Card className="ring-1 ring-transparent transition-shadow hover:ring-foreground/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{eng.jobPost.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isTalent
                          ? `Client: ${eng.client.name || eng.client.email}`
                          : `Talent: ${eng.talent.name || eng.talent.email}`
                        }
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Started {new Date(eng.startDate).toLocaleDateString()}
                        {eng.endDate && ` - Ended ${new Date(eng.endDate).toLocaleDateString()}`}
                      </p>
                      {eng.rate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Rate: ${eng.rate.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        eng.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {eng.status === 'active' ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-medium text-primary">View Details &rarr;</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
