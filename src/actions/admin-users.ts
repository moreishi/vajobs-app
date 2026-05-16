'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getUsers({
  search = '',
  role = '',
  page = 1,
  pageSize = 20,
}: {
  search?: string
  role?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { users: [], total: 0 }

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ]
  }

  if (role) {
    where.role = role
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        connects: true,
        createdAt: true,
        _count: { select: { jobPosts: true, applications: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return { users, total }
}

export async function toggleUserBan(userId: string) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Unauthorized' }
  if (userId === session.user.id) return { error: 'Cannot ban yourself' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found' }

  await prisma.user.update({
    where: { id: userId },
    data: { banned: !user.banned },
  })

  revalidatePath('/dashboard/admin/users')
  return { success: true, banned: !user.banned }
}

export async function updateUserRole(userId: string, role: string) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Unauthorized' }
  if (userId === session.user.id) return { error: 'Cannot change your own role' }

  const validRoles = ['guest', 'talent', 'client', 'admin']
  if (!validRoles.includes(role)) return { error: 'Invalid role' }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}
