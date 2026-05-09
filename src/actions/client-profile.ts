'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'

export async function updateClientProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can edit client profiles' }
  }

  const company = (formData.get('company') as string)?.trim() || null
  const title = (formData.get('title') as string)?.trim() || null
  const bio = (formData.get('bio') as string)?.trim() || null

  await prisma.clientProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, company, title, bio },
    update: { company, title, bio },
  })

  revalidatePath(ROUTES.DASHBOARD)
  return { success: true }
}

export async function getMyClientProfile() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  })
}

export async function getClientProfile(userId: string) {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  if (!profile) return null

  const jobCount = await prisma.jobPost.count({
    where: { posterId: userId, status: 'open' },
  })

  return { ...profile, jobCount }
}
