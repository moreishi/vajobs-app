'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COMMON_SKILLS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'

export function TalentSearch({
  initialQuery,
  initialSkills,
  initialAvailability,
  initialRateMin,
  initialRateMax,
  initialExpMin,
  initialExpMax,
  initialSort,
}: {
  initialQuery: string
  initialSkills: string
  initialAvailability: string
  initialRateMin: string
  initialRateMax: string
  initialExpMin: string
  initialExpMax: string
  initialSort: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [availability, setAvailability] = useState(initialAvailability)
  const [rateMin, setRateMin] = useState(initialRateMin)
  const [rateMax, setRateMax] = useState(initialRateMax)
  const [expMin, setExpMin] = useState(initialExpMin)
  const [expMax, setExpMax] = useState(initialExpMax)
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
    if (availability) params.set('availability', availability)
    if (rateMin) params.set('rateMin', rateMin)
    if (rateMax) params.set('rateMax', rateMax)
    if (expMin) params.set('expMin', expMin)
    if (expMax) params.set('expMax', expMax)
    if (sort) params.set('sort', sort)
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','))
    router.push(`/talents${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function handleClear() {
    setQuery('')
    setAvailability('')
    setRateMin('')
    setRateMax('')
    setExpMin('')
    setExpMax('')
    setSort('')
    setSelectedSkills([])
    router.push('/talents')
  }

  const hasFilters = !!(initialQuery || initialSkills || initialAvailability || initialRateMin || initialRateMax || initialExpMin || initialExpMax || initialSort)

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      {/* Row 1: search + availability + sort */}
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
        <div className="min-w-[140px]">
          <Label htmlFor="availability" className="sr-only">Availability</Label>
          <select
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All availability</option>
            <option value="available">Available</option>
            <option value="part-time">Part Time</option>
            <option value="full-time">Full Time</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div className="min-w-[130px]">
          <Label htmlFor="sort" className="sr-only">Sort</Label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="rate_asc">Rate: Low to High</option>
            <option value="rate_desc">Rate: High to Low</option>
            <option value="exp_desc">Most Experienced</option>
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

      {/* Row 2: numeric range filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[120px]">
          <Label htmlFor="rateMin" className="text-xs text-muted-foreground">Rate min ($)</Label>
          <Input
            id="rateMin"
            type="number"
            min={0}
            placeholder="Min"
            value={rateMin}
            onChange={(e) => setRateMin(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="min-w-[120px]">
          <Label htmlFor="rateMax" className="text-xs text-muted-foreground">Rate max ($)</Label>
          <Input
            id="rateMax"
            type="number"
            min={0}
            placeholder="Max"
            value={rateMax}
            onChange={(e) => setRateMax(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="min-w-[120px]">
          <Label htmlFor="expMin" className="text-xs text-muted-foreground">Experience min (yr)</Label>
          <Input
            id="expMin"
            type="number"
            min={0}
            placeholder="Min yrs"
            value={expMin}
            onChange={(e) => setExpMin(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="min-w-[120px]">
          <Label htmlFor="expMax" className="text-xs text-muted-foreground">Experience max (yr)</Label>
          <Input
            id="expMax"
            type="number"
            min={0}
            placeholder="Max yrs"
            value={expMax}
            onChange={(e) => setExpMax(e.target.value)}
            className="h-8 text-sm"
          />
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
