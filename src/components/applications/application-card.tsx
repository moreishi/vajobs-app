import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ApplicationStatusBadge } from '@/components/applications/application-status-badge'
import type { Application } from '@/types'

export function ApplicationCard({ application }: { application: Application }) {
  const isClientView = !!application.applicant
  const isTalentView = !!application.jobPost

  return (
    <Link href={`/dashboard/applications/${application.id}`} className="block transition-all hover:opacity-80">
      <Card className="ring-1 ring-transparent transition-shadow hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">
              {isTalentView ? application.jobPost!.title : `${application.applicant!.name || application.applicant!.email}`}
            </CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              {isClientView && (
                <>
                  {application.bidAmount && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      ${application.bidAmount.toFixed(2)} {application.bidType === 'hourly' ? '/hr' : ''}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Bid: {application.biddingConnects}
                  </span>
                </>
              )}
              <ApplicationStatusBadge status={application.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {isTalentView
              ? `Applied on ${new Date(application.createdAt).toLocaleDateString()}`
              : `Applied by ${application.applicant!.name || application.applicant!.email} on ${new Date(application.createdAt).toLocaleDateString()}`
            }
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
