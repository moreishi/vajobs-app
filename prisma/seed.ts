import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const SAMPLE_JOBS = [
  {
    title: 'Senior Frontend Developer',
    description:
      'We are looking for an experienced frontend developer to join our team.\n\nResponsibilities:\n- Build and maintain React applications\n- Collaborate with design team\n- Write unit and integration tests\n\nRequirements:\n- 5+ years of frontend experience\n- Strong TypeScript skills\n- Experience with Next.js',
    shortDescription:
      'Experienced frontend developer needed for a fast-growing SaaS company. Remote-friendly.',
    location: 'Remote',
    type: 'full-time',
    salaryRange: '$120k - $160k',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
  },
  {
    title: 'UX/UI Designer',
    description:
      'Join our product design team to create beautiful and intuitive interfaces.\n\nResponsibilities:\n- Design user flows and wireframes\n- Create high-fidelity mockups\n- Conduct user research',
    shortDescription: 'Design-driven company seeking a creative UX/UI designer for core product work.',
    location: 'San Francisco, CA',
    type: 'full-time',
    salaryRange: '$100k - $140k',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
  },
  {
    title: 'Backend Engineer (Contract)',
    description:
      'Short-term contract for backend API development.\n\nStack: Node.js, PostgreSQL, Redis\n\nDuration: 3 months with possible extension.',
    shortDescription: 'Contract role for a backend engineer to build scalable APIs.',
    location: 'Remote',
    type: 'contract',
    salaryRange: '$80/hr - $120/hr',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'REST APIs'],
  },
  {
    title: 'Part-time Technical Writer',
    description: 'We need a technical writer to document our API and create tutorials for developers.',
    shortDescription: 'Part-time technical writing role for a developer tools company.',
    location: 'Remote',
    type: 'part-time',
    salaryRange: '$50/hr - $70/hr',
    skills: ['Technical Writing', 'Markdown', 'API Documentation'],
  },
  {
    title: 'DevOps Engineer',
    description:
      'Help us scale our infrastructure and improve CI/CD pipelines.\n\nResponsibilities:\n- Manage AWS infrastructure\n- Automate deployments\n- Monitor production systems',
    shortDescription: 'Senior DevOps engineer to own cloud infrastructure and deployments.',
    location: 'New York, NY',
    type: 'full-time',
    salaryRange: '$130k - $170k',
    skills: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD'],
  },
]

async function main() {
  console.log('Seeding database ...\n')

  // Delete in dependency order
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.interview.deleteMany()
  await prisma.review.deleteMany()
  await prisma.engagement.deleteMany()
  await prisma.application.deleteMany()
  await prisma.savedJob.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.connectTransaction.deleteMany()
  await prisma.jobPost.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.clientProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('  Cleared existing data')

  const pw = await hash('password', 12)
  const now = new Date()

  const admin = await prisma.user.create({
    data: {
      email: 'admin@vajobs.online',
      password: pw,
      role: 'admin',
      name: 'Admin',
      emailVerified: now,
      connects: 9999,
    },
  })
  console.log(`  Created admin: admin@vajobs.online / password`)

  const client = await prisma.user.create({
    data: {
      email: 'client@example.com',
      password: pw,
      role: 'client',
      name: 'Acme Corp',
      emailVerified: now,
      connects: 9999,
    },
  })
  console.log(`  Created client: client@example.com / password`)

  const talent = await prisma.user.create({
    data: {
      email: 'talent@example.com',
      password: pw,
      role: 'talent',
      name: 'Jane Developer',
      emailVerified: now,
      connects: 50,
    },
  })
  console.log(`  Created talent: talent@example.com / password`)

  for (const j of SAMPLE_JOBS) {
    await prisma.jobPost.create({
      data: {
        ...j,
        skills: JSON.stringify(j.skills),
        status: 'open',
        posterId: client.id,
        posterName: 'Acme Corp',
      },
    })
  }
  await prisma.paymentSetting.upsert({
    where: { key: 'active_provider' },
    update: { value: 'stripe' },
    create: { key: 'active_provider', value: 'stripe' },
  })
  console.log('  Set default payment provider to Stripe')

  console.log(`  Created ${SAMPLE_JOBS.length} sample job posts`)

  console.log('\nDone!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
