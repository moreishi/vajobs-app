'use client'

import { signOut } from '@/actions/auth'
import { buttonVariants } from '@/components/ui/button'

export function SignOutForm() {
  return (
    <form action={signOut}>
      <button type="submit" className={buttonVariants({ variant: 'ghost' })}>
        Sign out
      </button>
    </form>
  )
}
