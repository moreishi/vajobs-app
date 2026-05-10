import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getEmailLogs, getEmailLogStats } from '@/actions/admin'
import { EmailLogFilters } from '@/components/admin/email-log-filters'
import { CheckCircleIcon, XCircleIcon, MailIcon } from 'lucide-react'

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
      <h1 className="mb-8 text-2xl font-bold">Email Logs</h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle></CardHeader>
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
              <div className="min-w-[600px] divide-y">
                <div className="grid grid-cols-5 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Status</span>
                  <span className="col-span-2">Email / Subject</span>
                  <span>Type</span>
                  <span>Date</span>
                </div>
                {logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-5 gap-4 py-3 items-center">
                    <div>
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircleIcon className="h-3 w-3" />
                          Sent
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
                      <p className="truncate text-xs text-muted-foreground">{log.email}</p>
                      {log.status === 'failed' && log.error && (
                        <p className="truncate text-xs text-destructive mt-0.5">{log.error}</p>
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
