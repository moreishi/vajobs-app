import type { ApplicationStatus } from '@/types'

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  reviewed: { label: 'Reviewed', className: 'bg-secondary text-secondary-foreground' },
  interview: { label: 'Interview', className: 'bg-primary text-primary-foreground' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  withdrawn: { label: 'Withdrawn', className: 'bg-muted text-muted-foreground line-through' },
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
