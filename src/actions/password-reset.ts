'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { enqueueTransactionalEmail } from '@/lib/email/worker'

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) return { success: true }

  // Invalidate any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  // Queue email for background worker — returns immediately
  await enqueueTransactionalEmail({
    userId: user.id,
    email,
    type: 'password_reset',
    subject: 'Reset your password',
    data: token,
  })

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token || !password) return { error: 'Token and password are required' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters' }
  if (password !== confirmPassword) return { error: 'Passwords do not match' }

  const stored = await prisma.verificationToken.findUnique({ where: { token } })
  if (!stored || stored.expires < new Date()) return { error: 'Invalid or expired reset token' }

  const hashed = await hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { email: stored.identifier },
      data: { password: hashed },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ])

  return { success: true }
}
