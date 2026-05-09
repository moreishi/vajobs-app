import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function EngagementsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'talent') redirect('/dashboard')

  const engagements = await prisma.application.findMany({
    where: { applicantId: session.user.id, status: 'accepted' },
    include: {
      jobPost: {
        select: { id: true, title: true, posterName: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">My Engagements</h1>

      {engagements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg text-muted-foreground">No engagements yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/jobs" className="text-primary underline">Browse open positions</Link> and apply to get hired.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {engagements.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <h3 className="font-semibold">{app.jobPost.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Client: {app.jobPost.posterName || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Hired {new Date(app.updatedAt).toLocaleDateString()}
                </p>
                <div className="mt-4">
                  <Link
                    href={`/dashboard/applications/${app.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    View Details
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
