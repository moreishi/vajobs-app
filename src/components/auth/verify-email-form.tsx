'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { verifyEmail } from '@/actions/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState('')

  useEffect(() => {
    async function run() {
      const result = await verifyEmail(token)
      if (result?.error) {
        setError(result.error)
        setState('error')
      } else {
        setState('success')
      }
    }
    run()
  }, [token])

  if (state === 'verifying') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Verifying your email</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (state === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Email verified!</CardTitle>
          <CardDescription>Your account is now active. You can sign in and start using Talent Hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={buttonVariants({ variant: 'default', className: 'w-full' })}>
            Sign in
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verification failed</CardTitle>
        <CardDescription>{error}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/login" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
          Back to Sign In
        </Link>
      </CardContent>
    </Card>
  )
}
