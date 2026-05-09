'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hash } from 'bcryptjs'
import { auth, signIn as authSignIn, signOut as authSignOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import type { Role } from '@/types'

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    await authSignIn('credentials', {
      email,
      password,
      redirect: false,
    })
  } catch {
    return { error: 'Invalid email or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signInWithGoogle() {
  await authSignIn('google', { redirectTo: '/dashboard' })
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as Role

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (!role || !['talent', 'client'].includes(role)) {
    return { error: 'Please select a role (Talent or Client)' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists' }
  }

  const hashedPassword = await hash(password, 12)

  await prisma.user.create({
    data: { email, password: hashedPassword, role, connects: 50 },
  })

  redirect('/login?checkEmail=true')
}

export async function signOut() {
  await authSignOut({ redirect: false })
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateAccount(_prevState: { error?: string; success?: boolean } | undefined, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim()
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string

  if (!email) return { error: 'Email is required' }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: 'User not found' }

  // Check email uniqueness if changing
  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { error: 'Email is already in use' }
  }

  // If changing password, verify current password
  if (newPassword) {
    if (!currentPassword) return { error: 'Current password is required to set a new password' }
    if (newPassword.length < 6) return { error: 'New password must be at least 6 characters' }

    const isValid = await (await import('bcryptjs')).compare(currentPassword, user.password || '')
    if (!isValid) return { error: 'Current password is incorrect' }

    const hashed = await (await import('bcryptjs')).hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { name, email, password: hashed },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, email },
    })
  }

  revalidatePath(ROUTES.SETTINGS)
  return { success: true }
}

export async function seedAdmin(): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@vajobs.online' },
    })

    if (existing) {
      await prisma.user.update({
        where: { email: 'admin@vajobs.online' },
        data: { role: 'admin' },
      })
      return { success: true, message: 'Admin user already exists. Role updated to admin.' }
    }

    const hashedPassword = await hash('password', 12)

    await prisma.user.create({
      data: {
        email: 'admin@vajobs.online',
        password: hashedPassword,
        role: 'admin',
      },
    })

    return { success: true, message: 'Admin user created successfully' }
  } catch {
    return { error: 'Failed to seed admin user' }
  }
}
