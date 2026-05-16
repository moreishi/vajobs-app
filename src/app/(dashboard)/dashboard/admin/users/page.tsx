import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { UserSearch } from './user-search'
import { UserRow } from './user-row'
import { getUsers } from '@/actions/admin-users'

export const dynamic = 'force-dynamic'

const VALID_ROLES = ['', 'guest', 'talent', 'client', 'admin']

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const params = await searchParams
  const roleParam = VALID_ROLES.includes(params.role || '') ? params.role || '' : ''
  const currentPage = Math.max(1, parseInt(params.page || '1'))

  const { users, total } = await getUsers({
    search: params.search || '',
    role: roleParam,
    page: currentPage,
  })

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Admin Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Manage Users</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Users ({total})</CardTitle>
            <UserSearch initialSearch={params.search || ''} initialRole={roleParam} />
          </div>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[600px] divide-y">
                <div className="grid grid-cols-7 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span className="col-span-2">User</span>
                  <span>Role</span>
                  <span>Connects</span>
                  <span>Jobs</span>
                  <span>Apps</span>
                  <span></span>
                </div>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} isSelf={user.id === session.user.id} />
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
              <p className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/dashboard/admin/users?${new URLSearchParams({ ...(params.search ? { search: params.search } : {}), ...(roleParam ? { role: roleParam } : {}), page: String(currentPage - 1) }).toString()}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/dashboard/admin/users?${new URLSearchParams({ ...(params.search ? { search: params.search } : {}), ...(roleParam ? { role: roleParam } : {}), page: String(currentPage + 1) }).toString()}`}
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
