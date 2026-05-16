'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { updateJob, getJob } from '@/actions/jobs'
import { getAssessments } from '@/actions/assessments'
import { AssessmentBuilder } from '@/components/assessments/assessment-builder'
import { AiJobGenerator } from '@/components/jobs/ai-job-generator'
import { TalentMatchingPanel } from '@/components/jobs/talent-matching-panel'
import type { AssessmentData } from '@/actions/assessments'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { deleteJob } from '@/actions/jobs'

const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
] as const

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    location: '',
    type: 'full-time',
    salaryRange: '',
    skills: '',
    status: 'open',
  })
  const [assessment, setAssessment] = useState<AssessmentData | undefined>(undefined)
  const [assessmentLoaded, setAssessmentLoaded] = useState(false)

  function handleAiApply(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function load() {
      const [job, assessments] = await Promise.all([
        getJob(jobId),
        getAssessments(jobId),
      ])
      if (!job) {
        router.push('/dashboard')
        return
      }
      if (assessments.length > 0) {
        setAssessment(assessments[0])
      }
      setAssessmentLoaded(true)
      setFormData({
        title: job.title,
        description: job.description,
        shortDescription: job.shortDescription || '',
        location: job.location || '',
        type: job.type,
        salaryRange: job.salaryRange || '',
        skills: job.skills.join(', '),
        status: job.status,
      })
      setIsFetching(false)
    }
    load()
  }, [jobId, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateJob(jobId, formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
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
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Job</CardTitle>
            <CardDescription>Update the details of your job listing.</CardDescription>
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
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="A brief summary for the job card (optional)"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    defaultValue={formData.type}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select type</option>
                    {JOB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
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
                    defaultValue={formData.location}
                    placeholder="Remote, NYC, etc."
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  value={formData.salaryRange}
                  onChange={(e) => setFormData((prev) => ({ ...prev, salaryRange: e.target.value }))}
                  placeholder="e.g. $120k - $160k"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  value={formData.skills}
                  onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, TypeScript, Next.js (comma separated)"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">Comma-separated list of required skills.</p>
              </div>

              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={formData.status}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="open">Open — visible to talents</option>
                  <option value="draft">Draft — save without publishing</option>
                  <option value="closed">Closed — hide from search</option>
                </select>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/dashboard" className="inline-flex items-center rounded-md border border-input px-4 text-sm font-medium hover:bg-accent">
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this job? This cannot be undone.')) {
                      await deleteJob(jobId)
                    }
                  }}
                  className="ml-auto inline-flex items-center rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  Delete Job
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <AiJobGenerator onApply={handleAiApply} />

        <TalentMatchingPanel jobPostId={jobId} />

        {assessmentLoaded && (
          <AssessmentBuilder jobPostId={jobId} existing={assessment} />
        )}
      </div>
    </>
  )
}
