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

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { name: data.name },
      })

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
  } catch (error) {
    if (error instanceof Error && error.message.includes('No record was found for an update')) {
      return { error: 'Your session has expired. Please sign out and sign back in to continue.' }
    }
    return { error: 'An unexpected error occurred. Please try again.' }
  }

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

  try {
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
  } catch (error) {
    if (error instanceof Error && error.message.includes('No record was found for an update')) {
      return { error: 'Your session has expired. Please sign out and sign back in to continue.' }
    }
    return { error: 'An unexpected error occurred. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function skipOnboarding() {
  revalidatePath('/dashboard')
  return { success: true }
}
