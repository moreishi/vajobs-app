'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function updateUserRole(userId: string, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const role = formData.get('role') as string
  if (!['guest', 'talent', 'client', 'admin'].includes(role)) {
    return { error: 'Invalid role' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}

export async function updateUserConnects(userId: string, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return { error: 'Not authorized' }

  const amount = parseInt(formData.get('connects') as string)
  if (isNaN(amount) || amount < 0) return { error: 'Invalid amount' }

  await prisma.user.update({
    where: { id: userId },
    data: { connects: amount },
  })

  revalidatePath('/dashboard/admin/users')
  return { success: true }
}
