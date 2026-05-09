'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateClientProfile, getMyClientProfile } from '@/actions/client-profile'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function ClientProfileEditPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const router = useRouter()

  const [formData, setFormData] = useState({
    company: '',
    title: '',
    bio: '',
  })

  useEffect(() => {
    async function load() {
      const profile = await getMyClientProfile()
      if (profile) {
        setFormData({
          company: profile.company || '',
          title: profile.title || '',
          bio: profile.bio || '',
        })
      }
      setIsFetching(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const result = await updateClientProfile(fd)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (isFetching) {
    return (
      <>
        <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">&larr; Dashboard</Link>
        <p className="text-muted-foreground">Loading...</p>
      </>
    )
  }

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Client Profile</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input
            id="company"
            name="company"
            type="text"
            placeholder="e.g. Acme Corp"
            defaultValue={formData.company}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Your Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Head of Talent Acquisition"
            defaultValue={formData.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">About / Bio</Label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Tell talents about your company and what you're looking for..."
            defaultValue={formData.bio}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  )
}
