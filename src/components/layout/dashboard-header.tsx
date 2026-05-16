'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { signOut } from '@/actions/auth'

type Props = {
  userEmail?: string | null
  notificationBell: React.ReactNode
}

export function DashboardHeader({ userEmail, notificationBell }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  const navLinks = [
    { href: '/dashboard/messages', label: 'Messages' },
    { href: '/dashboard/engagements', label: 'Engagements' },
    { href: '/dashboard/applications', label: 'Applications' },
    { href: '/dashboard/referrals', label: 'Referrals' },
    { href: '/dashboard/profile', label: 'Profile' },
    { href: '/dashboard/settings', label: 'Settings' },
    { href: '/jobs', label: 'Browse Jobs' },
    { href: '/talents', label: 'Browse Talents' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          VA Jobs Online
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard/messages"
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              pathname.startsWith('/dashboard/messages')
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Messages
          </Link>
          <Link
            href="/dashboard/engagements"
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              pathname.startsWith('/dashboard/engagements')
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Engagements
          </Link>
          <Link
            href="/dashboard/referrals"
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              pathname.startsWith('/dashboard/referrals')
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Referrals
          </Link>
          <Link
            href="/jobs"
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              pathname === '/jobs' || pathname.startsWith('/jobs/')
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Jobs
          </Link>
          <Link
            href="/talents"
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              pathname.startsWith('/talents')
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Talents
          </Link>
          {userEmail && (
            <span className="hidden lg:inline text-sm text-muted-foreground ml-2">{userEmail}</span>
          )}
          {notificationBell}
          <form action={signOut}>
            <button
              type="submit"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full')}
            >
              Sign out
            </button>
          </form>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {notificationBell}
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide panel */}
      <div
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-72 bg-background shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight" onClick={close}>
            VA Jobs Online
          </Link>
          <button
            onClick={close}
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={cn(
                'rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                pathname.startsWith(link.href) || pathname === link.href
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4 space-y-2">
          {userEmail && (
            <p className="px-4 text-xs text-muted-foreground truncate">{userEmail}</p>
          )}
          <form action={signOut}>
            <button
              type="submit"
              onClick={close}
              className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
