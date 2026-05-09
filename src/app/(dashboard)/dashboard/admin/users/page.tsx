import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { UserRoleSelect } from '@/components/admin/user-role-select'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      connects: true,
      createdAt: true,
      _count: { select: { jobPosts: true, applications: true } },
    },
  })

  return (
    <>
      <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Admin Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Manage Users</h1>

      <Card>
        <CardHeader><CardTitle>All Users ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[500px] divide-y">
              <div className="grid grid-cols-6 gap-4 py-2 text-xs font-medium text-muted-foreground">
              <span className="col-span-2">User</span>
              <span>Role</span>
              <span>Connects</span>
              <span>Jobs</span>
              <span>Apps</span>
            </div>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-6 gap-4 py-3 items-center">
                <div className="col-span-2 min-w-0">
                  <p className="truncate text-sm font-medium">{u.name || 'Unnamed'}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div><UserRoleSelect userId={u.id} currentRole={u.role} /></div>
                <div><span className="text-sm">{u.connects}</span></div>
                <div><span className="text-sm">{u._count.jobPosts}</span></div>
                <div><span className="text-sm">{u._count.applications}</span></div>
              </div>
            ))}
          </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
