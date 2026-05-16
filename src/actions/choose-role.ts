'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/types'

export async function chooseRole(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const role = formData.get('role') as Role
  if (!role || !['talent', 'client'].includes(role)) {
    return { error: 'Please select a role' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role },
  })

  revalidatePath('/', 'layout')

  return { success: true, role }
}
