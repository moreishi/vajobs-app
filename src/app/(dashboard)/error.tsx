'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <div className="flex gap-2">
        <button onClick={reset} className={buttonVariants()}>Try again</button>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>Dashboard</Link>
      </div>
    </div>
  )
}
