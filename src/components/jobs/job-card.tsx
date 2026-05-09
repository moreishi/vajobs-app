import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { JobPost } from '@/types'

export function JobCard({ job }: { job: JobPost }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block transition-all hover:opacity-80">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{job.title}</CardTitle>
            <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-secondary-foreground">
              {job.type.replace('-', ' ')}
            </span>
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
      </Card>
    </Link>
  )
}
