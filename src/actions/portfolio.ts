'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'

export type PortfolioItemData = {
  id: string
  title: string
  description: string | null
  url: string | null
  imageUrl: string | null
  type: string
  createdAt: string
}

export async function addPortfolioItem(data: {
  title: string
  description?: string
  url?: string
  imageUrl?: string
  type: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'talent') return { error: 'Only talents can add portfolio items' }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return { error: 'Profile not found. Set up your profile first.' }

  await prisma.portfolioItem.create({
    data: {
      profileId: profile.id,
      title: data.title,
      description: data.description || null,
      url: data.url || null,
      imageUrl: data.imageUrl || null,
      type: data.type,
    },
  })

  revalidatePath(ROUTES.PROFILE)
  return { success: true }
}

export async function updatePortfolioItem(
  itemId: string,
  data: {
    title: string
    description?: string
    url?: string
    imageUrl?: string
    type: string
  },
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return { error: 'Profile not found' }

  const item = await prisma.portfolioItem.findFirst({
    where: { id: itemId, profileId: profile.id },
  })
  if (!item) return { error: 'Portfolio item not found' }

  await prisma.portfolioItem.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description || null,
      url: data.url || null,
      imageUrl: data.imageUrl || null,
      type: data.type,
    },
  })

  revalidatePath(ROUTES.PROFILE)
  return { success: true }
}

export async function deletePortfolioItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return { error: 'Profile not found' }

  const item = await prisma.portfolioItem.findFirst({
    where: { id: itemId, profileId: profile.id },
  })
  if (!item) return { error: 'Portfolio item not found' }

  await prisma.portfolioItem.delete({ where: { id: itemId } })

  revalidatePath(ROUTES.PROFILE)
  return { success: true }
}

export async function getPortfolioItems(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) return []

  const items = await prisma.portfolioItem.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: 'desc' },
  })

  return items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }))
}
