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
  rateMin?: string
  rateMax?: string
  expMin?: string
  expMax?: string
  sort?: string
  page?: number
  pageSize?: number
}) {
  const { query, skills, availability, rateMin, rateMax, expMin, expMax, sort, page = 1, pageSize = 12 } = searchParams

  const where: Record<string, unknown> = { isPublic: true }

  if (availability && ['available', 'busy', 'unavailable', 'part-time', 'full-time'].includes(availability)) {
    where.availability = availability
  }

  if (rateMin || rateMax) {
    const rateFilter: Record<string, number> = {}
    if (rateMin) rateFilter.gte = parseInt(rateMin)
    if (rateMax) rateFilter.lte = parseInt(rateMax)
    where.hourlyRate = rateFilter
  }

  if (expMin || expMax) {
    const expFilter: Record<string, number> = {}
    if (expMin) expFilter.gte = parseInt(expMin)
    if (expMax) expFilter.lte = parseInt(expMax)
    where.experience = expFilter
  }

  if (skills) {
    const skillFilters = skills.split(',').map((s) => s.trim()).filter(Boolean)
    if (skillFilters.length > 0) {
      where.AND = skillFilters.map((skill) => ({
        skills: { contains: skill },
      }))
    }
  }

  if (query) {
    // Also find users whose name matches (to include their profiles)
    const matchingUsers = await prisma.user.findMany({
      where: { name: { contains: query } },
      select: { id: true },
    })
    const userIds = matchingUsers.map((u) => u.id)

    const orConditions: Record<string, unknown>[] = [
      { headline: { contains: query } },
      { bio: { contains: query } },
      { skills: { contains: query } },
    ]
    if (userIds.length > 0) {
      orConditions.push({ userId: { in: userIds } })
    }
    where.OR = orConditions
  }

  let orderBy: Record<string, string> = { updatedAt: 'desc' }
  if (sort === 'oldest') orderBy = { updatedAt: 'asc' }
  else if (sort === 'rate_asc') orderBy = { hourlyRate: 'asc' }
  else if (sort === 'rate_desc') orderBy = { hourlyRate: 'desc' }
  else if (sort === 'exp_desc') orderBy = { experience: 'desc' }

  const [total, profiles] = await Promise.all([
    prisma.profile.count({ where: where as any }),
    prisma.profile.findMany({
      where: where as any,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const result = profiles.map((p) => ({
    ...p,
    skills: JSON.parse(p.skills) as string[],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    availability: p.availability as Availability,
  }))

  return { profiles: result, total }
}
