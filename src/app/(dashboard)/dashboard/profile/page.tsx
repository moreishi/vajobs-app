'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateProfile, getMyProfile } from '@/actions/profile'
import { getPortfolioItems } from '@/actions/portfolio'
import { PortfolioManager } from '@/components/portfolio/portfolio-form'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function ProfileEditPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const router = useRouter()

  const [formData, setFormData] = useState({
    headline: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    experience: '',
    availability: 'available',
  })

  useEffect(() => {
    async function load() {
      const profile = await getMyProfile()
      if (profile) {
        setFormData({
          headline: profile.headline || '',
          bio: profile.bio || '',
          skills: profile.skills.join(', '),
          hourlyRate: profile.hourlyRate?.toString() || '',
          experience: profile.experience?.toString() || '',
          availability: profile.availability,
        })
        setIsPublic(profile.isPublic)
        setResumeUrl(profile.resumeUrl || null)
      }
      setIsFetching(false)
    }
    load()
  }, [])

  // Load portfolio items after profile is fetched
  useEffect(() => {
    async function loadPortfolio() {
      const profile = await getMyProfile()
      if (profile) {
        const items = await getPortfolioItems(profile.userId)
        setPortfolioItems(items)
      }
    }
    if (!isFetching) loadPortfolio()
  }, [isFetching])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const result = await updateProfile(fd)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="headline">Professional Headline</Label>
            <Input
              id="headline"
              name="headline"
              type="text"
              placeholder="e.g. Senior React Developer"
              defaultValue={formData.headline}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About Me</Label>
            <textarea
              id="bio"
              name="bio"
              rows={5}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Tell clients about yourself, your experience, and what you can do..."
              defaultValue={formData.bio}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              name="skills"
              type="text"
              placeholder="React, TypeScript, Node.js"
              defaultValue={formData.skills}
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of skills</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min={0}
                placeholder="e.g. 50"
                defaultValue={formData.hourlyRate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                name="experience"
                type="number"
                min={0}
                placeholder="e.g. 5"
                defaultValue={formData.experience}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <select
              id="availability"
              name="availability"
              defaultValue={formData.availability}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="available">Available</option>
              <option value="busy">Busy (limited availability)</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublic"
              name="isPublic"
              type="checkbox"
              defaultChecked={isPublic}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isPublic">Public profile (visible to clients and search engines)</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label>Resume</Label>
            <div className="flex items-center gap-3">
              {resumeUrl ? (
                <div className="flex items-center gap-2 text-sm">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    View current resume
                  </a>
                  <button
                    type="button"
                    onClick={() => setResumeUrl(null)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingResume(true)
                      try {
                        const fd = new FormData()
                        fd.set('file', file)
                        const res = await fetch('/api/upload', { method: 'POST', body: fd })
                        const data = await res.json()
                        if (res.ok && data.url) {
                          setResumeUrl(data.url)
                        }
                      } catch {
                        setError('Upload failed')
                      } finally {
                        setUploadingResume(false)
                      }
                    }}
                    className="text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground"
                  />
                  {uploadingResume && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Accepted: PDF, DOC, DOCX</p>
          </div>

          <input type="hidden" name="resumeUrl" value={resumeUrl || ''} />

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-8 max-w-2xl">
          <PortfolioManager items={portfolioItems} />
        </div>
    </>
  )
}
