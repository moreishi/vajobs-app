'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createJob } from '@/actions/jobs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { AiJobGenerator } from '@/components/jobs/ai-job-generator'

const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
] as const

export default function NewJobPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const shortDescriptionRef = useRef<HTMLInputElement>(null)
  const skillsRef = useRef<HTMLInputElement>(null)
  const salaryRangeRef = useRef<HTMLInputElement>(null)

  function handleAiApply(field: string, value: string) {
    const map: Record<string, React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>> = {
      title: titleRef,
      description: descriptionRef,
      shortDescription: shortDescriptionRef,
      skills: skillsRef,
      salaryRange: salaryRangeRef,
    }
    const el = map[field]?.current
    if (el) el.value = value
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createJob(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Post a New Job</CardTitle>
              <CardDescription>Fill in the details below to create a new job listing.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="mb-1 block text-sm font-medium">
                    Job Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    ref={titleRef}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="mb-1 block text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    required
                    ref={descriptionRef}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="shortDescription" className="mb-1 block text-sm font-medium">
                    Short Description
                  </label>
                  <input
                    id="shortDescription"
                    name="shortDescription"
                    type="text"
                    ref={shortDescriptionRef}
                    placeholder="A brief summary for the job card (optional)"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="type" className="mb-1 block text-sm font-medium">
                      Job Type <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      required
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="">Select type</option>
                      {JOB_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="mb-1 block text-sm font-medium">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="Remote, NYC, etc."
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="salaryRange" className="mb-1 block text-sm font-medium">
                    Salary Range
                  </label>
                  <input
                    id="salaryRange"
                    name="salaryRange"
                    type="text"
                    ref={salaryRangeRef}
                    placeholder="e.g. $120k - $160k"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="mb-1 block text-sm font-medium">
                    Skills
                  </label>
                  <input
                    id="skills"
                    name="skills"
                    type="text"
                    ref={skillsRef}
                    placeholder="React, TypeScript, Next.js (comma separated)"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Comma-separated list of required skills.</p>
                </div>

                <div>
                  <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="open">Open — visible to talents</option>
                    <option value="draft">Draft — save without publishing</option>
                  </select>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Posting...' : 'Post Job'}
                  </Button>
                  <Link href="/dashboard" className="inline-flex items-center rounded-lg border border-input px-4 text-sm font-medium hover:bg-accent">
                    Cancel
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <AiJobGenerator onApply={handleAiApply} />
        </div>
    </>
  )
}
