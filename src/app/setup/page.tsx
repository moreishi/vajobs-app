'use client'

import { useState } from 'react'
import { seedAdmin } from '@/actions/auth'
import { seedJobs } from '@/actions/jobs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSeedAdmin() {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const result = await seedAdmin()

    if (result?.error) {
      setError(result.error)
    } else {
      setMessage(result?.message ?? 'Done')
    }
    setIsLoading(false)
  }

  async function handleSeedJobs() {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const result = await seedJobs()

    if (result?.error) {
      setError(result.error)
    } else {
      setMessage(result?.message ?? 'Done')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup</CardTitle>
          <CardDescription>One-time setup tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Seed Admin User</h3>
            <p className="text-xs text-muted-foreground">
              Creates <code className="rounded bg-muted px-1 py-0.5">admin@vajobs.online</code> with password{' '}
              <code className="rounded bg-muted px-1 py-0.5">password</code> and the admin role.
            </p>
            <Button onClick={handleSeedAdmin} disabled={isLoading} size="sm">
              {isLoading ? 'Seeding...' : 'Seed Admin'}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Seed Sample Jobs</h3>
            <p className="text-xs text-muted-foreground">
              Creates sample job listings for testing the browse feature.
            </p>
            <Button onClick={handleSeedJobs} disabled={isLoading} size="sm">
              {isLoading ? 'Seeding...' : 'Seed Jobs'}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
