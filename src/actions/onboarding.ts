'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function completeTalentOnboarding(data: {
  name: string
  headline: string
  bio: string
  skills: string[]
  hourlyRate: number
  experience: number
  availability: string
}) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  await prisma.$transaction(async (tx) => {
    // Update user name
    await tx.user.update({
      where: { id: userId },
      data: { name: data.name },
    })

    // Upsert profile
    await tx.profile.upsert({
      where: { userId },
      create: {
        userId,
        headline: data.headline,
        bio: data.bio,
        skills: JSON.stringify(data.skills),
        hourlyRate: data.hourlyRate,
        experience: data.experience,
        availability: data.availability,
        isPublic: true,
      },
      update: {
        headline: data.headline,
        bio: data.bio,
        skills: JSON.stringify(data.skills),
        hourlyRate: data.hourlyRate,
        experience: data.experience,
        availability: data.availability,
        isPublic: true,
      },
    })
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeClientOnboarding(data: {
  name: string
  company: string
  title: string
  bio: string
}) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Not authenticated' }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name: data.name },
    })

    await tx.clientProfile.upsert({
      where: { userId },
      create: {
        userId,
        company: data.company,
        title: data.title,
        bio: data.bio,
      },
      update: {
        company: data.company,
        title: data.title,
        bio: data.bio,
      },
    })
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function skipOnboarding() {
  revalidatePath('/dashboard')
  return { success: true }
}
