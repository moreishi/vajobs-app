'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import type { Availability } from '@/types'

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'talent') return { error: 'Only talents can edit profiles' }

  const headline = (formData.get('headline') as string)?.trim() || null
  const bio = (formData.get('bio') as string)?.trim() || null
  const skillsRaw = formData.get('skills') as string
  const hourlyRate = parseInt(formData.get('hourlyRate') as string) || null
  const experience = parseInt(formData.get('experience') as string) || null
  const availability = (formData.get('availability') as string) || 'available'
  const isPublic = formData.get('isPublic') === 'on'
  const resumeUrl = (formData.get('resumeUrl') as string)?.trim() || null

  const skills = skillsRaw
    ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const validAvailability: Availability[] = ['available', 'busy', 'unavailable']
  if (!validAvailability.includes(availability as Availability)) {
    return { error: 'Invalid availability value' }
  }

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      headline,
      bio,
      skills: JSON.stringify(skills),
      hourlyRate,
      experience,
      availability,
      isPublic,
      resumeUrl,
    },
    update: {
      headline,
      bio,
      skills: JSON.stringify(skills),
      hourlyRate,
      experience,
      availability,
      isPublic,
      resumeUrl,
    },
  })

  revalidatePath(ROUTES.PROFILE)
  redirect(ROUTES.DASHBOARD)
}

export async function getMyProfile() {
  const session = await auth()
  if (!session?.user?.id) return null

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  if (!profile) return null

  return {
    ...profile,
    skills: JSON.parse(profile.skills) as string[],
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    availability: profile.availability as Availability,
  }
}

export async function getProfile(userId: string) {
  const session = await auth()

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  if (!profile) return null
  if (!profile.isPublic && session?.user?.id !== userId) return null

  return {
    ...profile,
    skills: JSON.parse(profile.skills) as string[],
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    availability: profile.availability as Availability,
  }
}

export async function searchTalents(searchParams: {
  query?: string
  skills?: string
  availability?: string
  page?: number
  pageSize?: number
}) {
  const { query, skills, availability, page = 1, pageSize = 12 } = searchParams

  const where: Record<string, unknown> = { isPublic: true }

  if (availability && ['available', 'busy', 'unavailable'].includes(availability)) {
    where.availability = availability
  }

  const profiles = await prisma.profile.findMany({
    where: where as any,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  let result = profiles.map((p) => ({
    ...p,
    skills: JSON.parse(p.skills) as string[],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    availability: p.availability as Availability,
  }))

  if (query) {
    const q = query.toLowerCase()
    result = result.filter(
      (p) =>
        (p.headline && p.headline.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q)) ||
        (p.user.name && p.user.name.toLowerCase().includes(q)) ||
        p.skills.some((s: string) => s.toLowerCase().includes(q))
    )
  }

  if (skills) {
    const filterSkills = skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (filterSkills.length > 0) {
      result = result.filter((p) =>
        filterSkills.some((fs) => p.skills.some((s: string) => s.toLowerCase().includes(fs)))
      )
    }
  }

  const total = result.length
  const paginated = result.slice((page - 1) * pageSize, page * pageSize)

  return { profiles: paginated, total }
}
