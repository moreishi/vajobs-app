'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { chooseRole } from '@/actions/choose-role'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ChooseRoleForm() {
  const wrappedAction = async (_prev: { error?: string } | undefined, formData: FormData) => {
    return chooseRole(formData)
  }
  const [state, formAction] = useActionState(wrappedAction, undefined)
  const [selected, setSelected] = useState('')

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="role" value={selected} />
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSelected('client')}
          className={cn(
            'flex flex-col items-center gap-4 rounded-xl border-2 p-8 text-center transition-all',
            selected === 'client'
              ? 'border-primary bg-primary/5 ring-2 ring-primary'
              : 'border-border text-muted-foreground hover:border-muted-foreground/30'
          )}
        >
          <svg className="h-10 w-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.913-.413m2.378 3.344a2.182 2.182 0 01-2.652 1.852 2.18 2.18 0 01-1.65-2.022m-1.496-1.424a2.181 2.181 0 002.287 2.89 2.18 2.18 0 002.662-1.852m-3.478 7.418a2.18 2.18 0 002.287 2.89 2.18 2.18 0 002.662-1.852m-6.62 1.852c-.343.048-.69.075-1.039.082-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.913-.413m2.378 3.344a2.182 2.182 0 01-2.652 1.852 2.18 2.18 0 01-1.65-2.022m-3.502 6.258a2.18 2.18 0 01-2.287-2.89 2.18 2.18 0 012.287-2.89 2.18 2.18 0 011.65 2.022m-1.65-2.022a2.18 2.18 0 012.287-2.89c1.926.255 3.603.913 4.937 1.85" />
          </svg>
          <div>
            <p className="text-lg font-semibold text-foreground">I&apos;m Hiring</p>
            <p className="mt-1 text-sm">Post jobs, review proposals, and find the perfect virtual assistant.</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setSelected('talent')}
          className={cn(
            'flex flex-col items-center gap-4 rounded-xl border-2 p-8 text-center transition-all',
            selected === 'talent'
              ? 'border-primary bg-primary/5 ring-2 ring-primary'
              : 'border-border text-muted-foreground hover:border-muted-foreground/30'
          )}
        >
          <svg className="h-10 w-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <div>
            <p className="text-lg font-semibold text-foreground">I&apos;m Talent</p>
            <p className="mt-1 text-sm">Browse jobs, apply with proposals, and grow your career.</p>
          </div>
        </button>
      </div>
      {state?.error && <p className="text-sm text-destructive text-center">{state.error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={!selected}>
        Get Started
      </Button>
    </form>
  )
}
