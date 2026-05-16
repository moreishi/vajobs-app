'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function UserSearch({ initialSearch, initialRole }: { initialSearch: string; initialRole: string }) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [role, setRole] = useState(initialRole)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    router.push(`/dashboard/admin/users?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="flex h-8 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="flex h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      >
        <option value="">All Roles</option>
        <option value="guest">Guest</option>
        <option value="talent">Talent</option>
        <option value="client">Client</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        Search
      </button>
    </form>
  )
}
