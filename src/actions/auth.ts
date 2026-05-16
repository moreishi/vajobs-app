'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import { hash } from 'bcryptjs'
import { auth, signIn as authSignIn, signOut as authSignOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'
import { sendEmail, buildEmailHtml } from '@/lib/email'
import { DEFAULT_EMAIL_PREFERENCES } from '@/lib/notification-defaults'
import { awardXp } from '@/actions/reputation'
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

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  })

  if (user && !user.emailVerified) {
    return { error: 'Please verify your email before signing in. Check your inbox for the verification link.' }
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

  // Validate referral code if provided
  const referralCodeInput = formData.get('referralCode') as string | null
  let referredById: string | null = null
  if (referralCodeInput) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCodeInput.trim().toUpperCase() },
      select: { id: true },
    })
    if (!referrer) {
      return { error: 'Invalid referral code' }
    }
    referredById = referrer.id
  }

  const hashedPassword = await hash(password, 12)
  const userReferralCode = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  const timezone = (formData.get('timezone') as string)?.trim() || undefined

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, role, connects: 50, referralCode: userReferralCode, referredById, timezone },
  })

  // Seed default notification preferences (opt-out for high-frequency types)
  await prisma.notificationPreference.createMany({
    data: Object.entries(DEFAULT_EMAIL_PREFERENCES).map(([type, email]) => ({
      userId: user.id,
      type,
      email,
    })),
  })

  if (process.env.RESEND_API_KEY) {
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    })

    const verifyUrl = `${process.env.AUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    sendEmail({
      to: email,
      subject: 'Verify your email - VA Jobs Online',
      html: buildEmailHtml(
        'Thanks for signing up! Click the button below to verify your email address and activate your account.',
        { text: 'Verify Email', url: verifyUrl }
      ),
    })
  }

  redirect('/login?checkEmail=true')
}

export async function verifyEmail(token: string) {
  if (!token) return { error: 'Verification token is required' }

  const stored = await prisma.verificationToken.findUnique({ where: { token } })
  if (!stored) return { error: 'Invalid verification link' }
  if (stored.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return { error: 'Verification link has expired. Please sign up again.' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: stored.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ])

  const user = await prisma.user.findUnique({ where: { email: stored.identifier }, select: { id: true } })
  if (user) {
    await awardXp({ userId: user.id, amount: 50, reason: 'email_verified', referenceId: 'email_verified' })
  }

  return { success: true }
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
  const emailInput = (formData.get('email') as string)?.trim()
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const timezone = (formData.get('timezone') as string)?.trim() || undefined

  // Fall back to current email when field is disabled (not submitted)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: 'User not found' }
  const email = emailInput || user.email

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
      data: { name, email, password: hashed, timezone },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, email, timezone },
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

export async function updateProfileImage(imageUrl: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  })

  revalidatePath(ROUTES.SETTINGS)
  return { success: true }
}
