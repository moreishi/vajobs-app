import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database ...\n')

  // Delete in dependency order
  await prisma.vaSubscription.deleteMany()
  await prisma.vaSubscriptionPlan.deleteMany()
  await prisma.clientSubscription.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.interview.deleteMany()
  await prisma.review.deleteMany()
  await prisma.engagement.deleteMany()
  await prisma.application.deleteMany()
  await prisma.savedJob.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.notificationPreference.deleteMany()
  await prisma.connectTransaction.deleteMany()
  await prisma.jobPost.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.clientProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('  Cleared existing data')

  const isProd = process.env.NODE_ENV === 'production'
  const rawPassword = isProd ? crypto.randomBytes(24).toString('hex') : 'password'
  const pw = await hash(rawPassword, 12)
  const now = new Date()

  // ── Admin ──
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vajobs.online',
      password: pw,
      role: 'admin',
      name: 'Admin',
      emailVerified: now,
      connects: 9999,
      referralCode: crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase(),
    },
  })

  if (isProd) {
    console.log(`\n  ╔══════════════════════════════════════════════════╗`)
    console.log(`  ║  Admin account created                          ║`)
    console.log(`  ║  Email: admin@vajobs.online                     ║`)
    console.log(`  ║  Password: ${rawPassword}              ║`)
    console.log(`  ╚══════════════════════════════════════════════════╝\n`)

    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: 'admin@vajobs.online',
            subject: 'Admin account created - VA Jobs Online',
            html: `<p>Your admin account has been created.</p><p><strong>Email:</strong> admin@vajobs.online</p><p><strong>Password:</strong> <code>${rawPassword}</code></p><p>Please change your password after logging in.</p>`,
          }),
        })
        console.log('  Admin credentials emailed to admin@vajobs.online')
      } catch {}
    }
  } else {
    console.log(`  Created admin: admin@vajobs.online / password`)
  }

  // Seed notification preferences for admin
  const DEFAULT_NOTIFICATION_PREFS: Record<string, boolean> = {
    application_received: true,
    status_updated: false,
    interview_scheduled: true,
    interview_cancelled: true,
    message_received: false,
    review_received: false,
    engagement_ended: false,
    connects_purchased: true,
    payment_completed: true,
    subscription_cancelled: true,
    subscription_renewal: true,
    contract_created: true,
    contract_signed: true,
    contract_terminated: true,
    invoice_received: true,
    invoice_paid: true,
    milestone_created: false,
    milestone_completed: false,
    milestone_approved: true,
    milestone_rejected: false,
    proposal_accepted: true,
    proposal_updated: false,
  }

  await prisma.notificationPreference.createMany({
    data: Object.entries(DEFAULT_NOTIFICATION_PREFS).map(([type, email]) => ({
      userId: admin.id,
      type,
      email,
    })),
  })
  console.log('  Seeded notification preferences for admin')

  // ── Subscription plans ──
  const plans = [
    {
      name: 'Free',
      description: 'Get started with basic hiring tools',
      durationMonths: 1,
      priceInCents: 0,
      connectsPerPeriod: null,
      sortOrder: 1,
    },
    {
      name: 'Starter',
      description: 'For growing teams with regular hiring needs',
      durationMonths: 1,
      priceInCents: 4900,
      connectsPerPeriod: 75,
      sortOrder: 2,
    },
    {
      name: 'Growth',
      description: 'For active recruiters who want the best results',
      durationMonths: 1,
      priceInCents: 7900,
      connectsPerPeriod: 200,
      badge: 'Most Popular',
      sortOrder: 3,
    },
    {
      name: 'Scale',
      description: 'For enterprises with high-volume hiring',
      durationMonths: 1,
      priceInCents: 14900,
      connectsPerPeriod: 500,
      sortOrder: 4,
    },
  ]

  for (const p of plans) {
    await prisma.subscriptionPlan.create({ data: p })
  }
  console.log(`  Created ${plans.length} subscription plans`)

  // ── Payment settings ──
  await prisma.paymentSetting.upsert({
    where: { key: 'active_provider' },
    update: { value: 'stripe' },
    create: { key: 'active_provider', value: 'stripe' },
  })
  console.log('  Set default payment provider to Stripe')

  // ── VA subscription plans ──
  const vaPlans = [
    {
      name: 'Premium VA',
      description: 'Stand out with the Premium VA badge and priority features',
      priceInCents: 999,
      badge: 'Most Popular',
      sortOrder: 1,
      features: JSON.stringify([
        'Premium VA badge on your profile',
        'Priority placement in search results',
        'Application insights dashboard',
        'Priority support',
      ]),
    },
    {
      name: 'Premium VA Pro',
      description: 'Everything in Premium plus advanced tools and analytics',
      priceInCents: 1999,
      sortOrder: 2,
      features: JSON.stringify([
        'Everything in Premium VA',
        'Featured profile badge',
        'Top search placement',
        'Advanced analytics & insights',
        'Profile boost — shown first in category results',
        'Dedicated priority support',
      ]),
    },
  ]

  for (const p of vaPlans) {
    await prisma.vaSubscriptionPlan.create({ data: p })
  }
  console.log(`  Created ${vaPlans.length} VA subscription plans`)

  console.log(`\nDone! Run \`npm run seed:demo\` to add test accounts and sample job posts.`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
