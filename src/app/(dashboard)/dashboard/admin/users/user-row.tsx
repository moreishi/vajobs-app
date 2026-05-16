'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleUserBan, updateUserRole } from '@/actions/admin-users'

type UserRowProps = {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    banned: boolean
    connects: number
    createdAt: Date
    _count: { jobPosts: number; applications: number }
  }
  isSelf: boolean
}

export function UserRow({ user, isSelf }: UserRowProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleBan() {
    startTransition(async () => {
      await toggleUserBan(user.id)
      router.refresh()
    })
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(async () => {
      await updateUserRole(user.id, e.target.value)
      router.refresh()
    })
  }

  return (
    <div className={`grid grid-cols-7 gap-4 py-3 items-center ${user.banned ? 'opacity-60' : ''}`}>
      <div className="col-span-2 min-w-0">
        <p className="truncate text-sm font-medium">
          {user.name || 'Unnamed'}
          {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <div>
        {isSelf ? (
          <span className="text-sm capitalize">{user.role}</span>
        ) : (
          <select
            value={user.role}
            onChange={handleRoleChange}
            disabled={pending}
            className="flex h-7 rounded-md border border-input bg-transparent px-2 py-0 text-xs"
          >
            <option value="guest">Guest</option>
            <option value="talent">Talent</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
        )}
      </div>
      <div><span className="text-sm">{user.connects}</span></div>
      <div><span className="text-sm">{user._count.jobPosts}</span></div>
      <div><span className="text-sm">{user._count.applications}</span></div>
      <div>
        {!isSelf && (
          <button
            onClick={handleBan}
            disabled={pending}
            className={`text-xs hover:underline ${user.banned ? 'text-green-600' : 'text-destructive'}`}
          >
            {pending ? '...' : user.banned ? 'Unban' : 'Ban'}
          </button>
        )}
      </div>
    </div>
  )
}
