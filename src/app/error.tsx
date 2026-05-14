'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { logClientError } from '@/lib/client-logger'

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    logClientError('Root Error', error.message, error.stack)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">{error.message || 'An unexpected error occurred.'}</p>
      <div className="flex gap-2">
        <button onClick={reset} className={buttonVariants()}>Try again</button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>Home</Link>
      </div>
    </div>
  )
}
