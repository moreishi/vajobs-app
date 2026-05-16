import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getEmailLogs, getEmailLogStats } from '@/actions/admin'
import { EmailLogFilters } from '@/components/admin/email-log-filters'
import { RetryEmailButton } from '@/components/admin/retry-email-button'
import { ProcessPendingButton } from '@/components/admin/process-pending-button'
import { CheckCircleIcon, XCircleIcon, MailIcon, ClockIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Email Logs - Admin',
}

export default async function EmailLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; search?: string; page?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const [stats, { logs, total }] = await Promise.all([
    getEmailLogStats(),
    getEmailLogs({
      status: params.status,
      type: params.type,
      search: params.search,
      page: currentPage,
    }),
  ])

  const totalPages = Math.ceil(total / 50)

  return (
    <>
      <Link
        href="/dashboard/admin"
        className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Admin Dashboard
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Email Logs</h1>
        <ProcessPendingButton />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.sent ?? 0}</p>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-3xl font-bold text-destructive">{stats?.failed ?? 0}</p>
            <XCircleIcon className="h-5 w-5 text-destructive" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats?.pending ?? 0}</p>
            <ClockIcon className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last 7 Days</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-3xl font-bold">{stats?.recentCount ?? 0}</p>
            <MailIcon className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <EmailLogFilters
        currentStatus={params.status || ''}
        currentType={params.type || ''}
        currentSearch={params.search || ''}
      />

      {/* Logs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {total} email{total !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[650px] divide-y">
                <div className="grid grid-cols-6 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Status</span>
                  <span className="col-span-2">Email / Subject</span>
                  <span>Type</span>
                  <span>Date</span>
                  <span />
                </div>
                {logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-6 gap-4 py-3 items-center">
                    <div>
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircleIcon className="h-3 w-3" />
                          Sent
                        </span>
                      ) : log.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <ClockIcon className="h-3 w-3" />
                          Pending
                        </span>
                      ) : log.status === 'skipped' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                          Skipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400" title={log.error || ''}>
                          <XCircleIcon className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="truncate text-sm">{log.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">{log.email || '—'}</p>
                      {log.status === 'failed' && log.error && (
                        <p className="truncate text-xs text-destructive mt-0.5">{log.error}</p>
                      )}
                      {log.status === 'skipped' && log.error && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">{log.error}</p>
                      )}
                    </div>
                    <div>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                        {log.type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                      <br />
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      {log.status === 'failed' && (
                        <RetryEmailButton emailLogId={log.id} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No email logs found.</p>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/dashboard/admin/email-logs?${new URLSearchParams({ ...params, page: String(currentPage - 1) })}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/dashboard/admin/email-logs?${new URLSearchParams({ ...params, page: String(currentPage + 1) })}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </>
  )
}
