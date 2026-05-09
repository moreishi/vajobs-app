'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function JobSearch({
  initialQuery,
  initialType,
  initialSkills,
}: {
  initialQuery: string
  initialType: string
  initialSkills: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState(initialType)
  const [skills, setSkills] = useState(initialSkills)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (type) params.set('type', type)
    if (skills) params.set('skills', skills)
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function handleClear() {
    setQuery('')
    setType('')
    setSkills('')
    router.push('/jobs')
  }

  const hasFilters = !!(initialQuery || initialType || initialSkills)

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="query" className="sr-only">Search</Label>
          <Input
            id="query"
            type="text"
            placeholder="Search by title, description, or skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="type" className="sr-only">Job Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <Label htmlFor="skills" className="sr-only">Skills</Label>
          <Input
            id="skills"
            type="text"
            placeholder="Filter by skills..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Search</Button>
          {hasFilters && (
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
