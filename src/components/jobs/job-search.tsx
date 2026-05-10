'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COMMON_SKILLS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'

export function JobSearch({
  initialQuery,
  initialType,
  initialSkills,
  initialLocation,
  initialSort,
}: {
  initialQuery: string
  initialType: string
  initialSkills: string
  initialLocation: string
  initialSort: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState(initialType)
  const [location, setLocation] = useState(initialLocation)
  const [sort, setSort] = useState(initialSort)
  const [selectedSkills, setSelectedSkills] = useState(
    useMemo(() => initialSkills.split(',').map(s => s.trim()).filter(Boolean), [initialSkills])
  )
  const [showAllSkills, setShowAllSkills] = useState(false)
  const displaySkills = showAllSkills ? COMMON_SKILLS : COMMON_SKILLS.slice(0, 8)

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (type) params.set('type', type)
    if (location) params.set('location', location)
    if (sort) params.set('sort', sort)
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','))
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function handleClear() {
    setQuery('')
    setType('')
    setLocation('')
    setSort('')
    setSelectedSkills([])
    router.push('/jobs')
  }

  const hasFilters = !!(initialQuery || initialType || initialSkills || initialLocation || initialSort)

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="query" className="sr-only">Search</Label>
          <Input
            id="query"
            type="text"
            placeholder="Search by title or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="min-w-[140px]">
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
        <div className="min-w-[160px]">
          <Label htmlFor="location" className="sr-only">Location</Label>
          <Input
            id="location"
            type="text"
            placeholder="Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="min-w-[130px]">
          <Label htmlFor="sort" className="sr-only">Sort</Label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <div className="flex gap-2 items-end">
          <Button type="submit">Search</Button>
          {hasFilters && (
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Skills tag selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Filter by skills</span>
          {COMMON_SKILLS.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllSkills(!showAllSkills)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAllSkills ? 'Show less' : `Show all (${COMMON_SKILLS.length})`}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {displaySkills.map((skill) => {
            const isSelected = selectedSkills.includes(skill)
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input text-muted-foreground hover:border-muted-foreground/30',
                )}
              >
                {skill}
                {isSelected && <XIcon className="h-3 w-3" />}
              </button>
            )
          })}
        </div>
        {selectedSkills.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedSkills([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all skills
          </button>
        )}
      </div>
    </form>
  )
}
