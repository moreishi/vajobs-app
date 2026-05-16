import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SaveButton } from '@/components/jobs/save-button'
import type { JobPost } from '@/types'

function getExpiryLabel(expiresAt: string | null): { label: string; className: string } | null {
  if (!expiresAt) return null
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: 'Expired', className: 'bg-destructive/10 text-destructive' }
  if (days <= 3) return { label: `${days}d left`, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
  if (days <= 7) return { label: `${days}d left`, className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300' }
  return null
}

export function JobCard({ job, isSaved }: { job: JobPost; isSaved?: boolean }) {
  const expiry = getExpiryLabel(job.expires_at)
  return (
    <Card className="relative h-full">
      <Link href={`/jobs/${job.id}`} className="block transition-all hover:opacity-80">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{job.title}</CardTitle>
            <div className="flex shrink-0 items-center gap-1">
              {expiry && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${expiry.className}`}>
                  {expiry.label}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-secondary-foreground">
                {job.type.replace('-', ' ')}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {job.short_description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {job.short_description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {job.location && <span>{job.location}</span>}
            {job.salary_range && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{job.salary_range}</span>
              </>
            )}
          </div>
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 3 && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  +{job.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Link>
      {isSaved !== undefined && (
        <div className="absolute right-2 top-2 z-10">
          <SaveButton jobId={job.id} isSaved={isSaved} />
        </div>
      )}
    </Card>
  )
}
