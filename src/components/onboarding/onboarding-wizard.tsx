'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeTalentOnboarding, completeClientOnboarding, skipOnboarding } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

const COMMON_SKILLS = [
  'Administrative Support', 'Customer Service', 'Data Entry', 'Social Media Management',
  'Bookkeeping', 'Email Management', 'Calendar Management', 'Project Management',
  'Content Writing', 'Graphic Design', 'Video Editing', 'Web Development',
  'SEO', 'Digital Marketing', 'Sales', 'Lead Generation',
]

export function TalentOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    headline: '',
    bio: '',
    skills: [] as string[],
    hourlyRate: '',
    experience: '',
    availability: 'available',
  })

  const totalSteps = 4
  const progress = ((step + 1) / totalSteps) * 100

  async function handleFinish() {
    setLoading(true)
    setError(null)
    const result = await completeTalentOnboarding({
      name: form.name,
      headline: form.headline,
      bio: form.bio,
      skills: form.skills,
      hourlyRate: parseInt(form.hourlyRate) || 0,
      experience: parseInt(form.experience) || 0,
      availability: form.availability,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }))
  }

  const canNext = () => {
    switch (step) {
      case 0: return form.name.trim().length > 0 && form.headline.trim().length > 0
      case 1: return form.bio.trim().length > 0 && form.skills.length > 0
      case 2: return form.hourlyRate.length > 0
      default: return true
    }
  }

  return (
    <Card className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted rounded-t-lg overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <CardHeader>
        <CardTitle>
          {step === 0 && 'Welcome to Talent Hub'}
          {step === 1 && 'Tell us about yourself'}
          {step === 2 && 'Set your rate'}
          {step === 3 && 'You\'re all set!'}
        </CardTitle>
        <CardDescription>
          {step === 0 && 'Let\'s get your profile set up so clients can find you.'}
          {step === 1 && 'Describe your background and select your skills.'}
          {step === 2 && 'Set your hourly rate and availability preferences.'}
          {step === 3 && 'Your profile is ready. Start applying to jobs!'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Developer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input id="headline" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder="e.g. Senior Virtual Assistant & Admin Specialist" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell clients about your experience, strengths, and what makes you unique..."
              />
            </div>
            <div className="space-y-2">
              <Label>Skills (select at least one)</Label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                      form.skills.includes(skill)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input text-muted-foreground hover:border-muted-foreground/30',
                    )}
                  >
                    {form.skills.includes(skill) && <CheckIcon className="h-3 w-3" />}
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input id="rate" type="number" min={1} value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} placeholder="25" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input id="experience" type="number" min={0} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="3" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="availability">Availability</Label>
              <select
                id="availability"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.availability}
                onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
              >
                <option value="available">Immediately Available</option>
                <option value="part-time">Part Time (20hrs/week)</option>
                <option value="full-time">Full Time (40hrs/week)</option>
                <option value="unavailable">Not Currently Available</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your profile is live. Start browsing jobs and applying with your connects.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between">
        {step > 0 && step < 3 && (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
        )}
        {step === 0 && <div />}
        {step < 2 && (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>Continue</Button>
        )}
        {step === 2 && (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>Review</Button>
        )}
        {step === 3 && (
          <Button onClick={handleFinish} disabled={loading} className="w-full">
            {loading ? 'Setting up...' : 'Go to Dashboard'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export function ClientOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    company: '',
    title: '',
    bio: '',
  })

  const totalSteps = 3
  const progress = ((step + 1) / totalSteps) * 100

  async function handleFinish() {
    setLoading(true)
    setError(null)
    const result = await completeClientOnboarding({
      name: form.name,
      company: form.company,
      title: form.title,
      bio: form.bio,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <div className="h-1 w-full bg-muted rounded-t-lg overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <CardHeader>
        <CardTitle>
          {step === 0 && 'Welcome to Talent Hub'}
          {step === 1 && 'Tell us about your company'}
          {step === 2 && 'You\'re all set!'}
        </CardTitle>
        <CardDescription>
          {step === 0 && 'Set up your profile so talent can find and apply to your jobs.'}
          {step === 1 && 'Help talent understand who they\'ll be working with.'}
          {step === 2 && 'Your profile is ready. Start posting jobs and finding talent!'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {step === 0 && (
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Smith" />
          </div>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Your Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Operations Manager" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Company Bio</Label>
              <textarea
                id="bio"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell talent about your company culture, values, and what kind of people you're looking for..."
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your company profile is live. Start posting jobs and finding top talent.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between">
        {step > 0 && step < 2 && (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
        )}
        {step === 0 && <div />}
        {step < 1 && (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!form.name.trim()}>Continue</Button>
        )}
        {step === 1 && (
          <Button onClick={() => setStep((s) => s + 1)}>Review</Button>
        )}
        {step === 2 && (
          <Button onClick={handleFinish} disabled={loading} className="w-full">
            {loading ? 'Setting up...' : 'Go to Dashboard'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
