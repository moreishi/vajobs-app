'use client'

import { useActionState } from 'react'
import { updateUserRole } from '@/actions/admin'

export function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const updateWithId = async (_prev: { error?: string } | undefined, formData: FormData) => {
    return updateUserRole(userId, formData)
  }

  const [state, action] = useActionState(updateWithId, undefined)

  return (
    <form action={action}>
      <select
        name="role"
        defaultValue={currentRole}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="h-8 rounded border border-input bg-transparent px-2 text-sm"
      >
        <option value="guest">Guest</option>
        <option value="talent">Talent</option>
        <option value="client">Client</option>
        <option value="admin">Admin</option>
      </select>
      {state?.error && <p className="text-xs text-destructive mt-1">{state.error}</p>}
    </form>
  )
}
