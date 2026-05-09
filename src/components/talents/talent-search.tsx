'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TalentSearch({
  initialQuery,
  initialSkills,
  initialAvailability,
}: {
  initialQuery: string
  initialSkills: string
  initialAvailability: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [skills, setSkills] = useState(initialSkills)
  const [availability, setAvailability] = useState(initialAvailability)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (skills) params.set('skills', skills)
    if (availability) params.set('availability', availability)
    router.push(`/talents${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function handleClear() {
    setQuery('')
    setSkills('')
    setAvailability('')
    router.push('/talents')
  }

  const hasFilters = !!(initialQuery || initialSkills || initialAvailability)

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="query" className="sr-only">Search</Label>
          <Input
            id="query"
            type="text"
            placeholder="Search by name, headline, or skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
        <div>
          <Label htmlFor="availability" className="sr-only">Availability</Label>
          <select
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="">All availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </select>
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
