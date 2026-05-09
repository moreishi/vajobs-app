'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ROUTES } from '@/lib/constants'

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship'] as const

export async function createJob(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  if (session.user.role !== 'client' && session.user.role !== 'admin') {
    return { error: 'Only clients can create job posts' }
  }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const shortDescription = (formData.get('shortDescription') as string)?.trim() || null
  const location = (formData.get('location') as string)?.trim() || null
  const type = formData.get('type') as string
  const salaryRange = (formData.get('salaryRange') as string)?.trim() || null
  const skillsRaw = formData.get('skills') as string
  const status = formData.get('status') as string || 'open'

  if (!title || title.length < 3) return { error: 'Title must be at least 3 characters' }
  if (!description || description.length < 20) return { error: 'Description must be at least 20 characters' }
  if (!JOB_TYPES.includes(type as typeof JOB_TYPES[number])) return { error: 'Invalid job type' }

  const skills = skillsRaw
    ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })

  await prisma.jobPost.create({
    data: {
      title,
      description,
      shortDescription,
      location,
      type,
      salaryRange,
      skills: JSON.stringify(skills),
      status: status === 'draft' ? 'draft' : 'open',
      posterId: session.user.id,
      posterName: user?.name || session.user.email?.split('@')[0] || 'Client',
    },
  })

  redirect(ROUTES.JOBS)
}

export async function seedJobs() {
  const poster = await prisma.user.findFirst({
    where: { role: { in: ['client', 'admin'] } },
    orderBy: { createdAt: 'asc' },
  })

  if (!poster) {
    return { error: 'No users found. Create at least one user first.' }
  }

  const jobs = [
    {
      title: 'Senior Frontend Developer',
      description: 'We are looking for an experienced frontend developer to join our team.\n\nResponsibilities:\n- Build and maintain React applications\n- Collaborate with design team\n- Write unit and integration tests\n\nRequirements:\n- 5+ years of frontend experience\n- Strong TypeScript skills\n- Experience with Next.js',
      shortDescription: 'Experienced frontend developer needed for a fast-growing SaaS company. Remote-friendly.',
      location: 'Remote',
      type: 'full-time',
      salaryRange: '$120k - $160k',
      skills: JSON.stringify(['React', 'TypeScript', 'Next.js', 'Tailwind CSS']),
      status: 'open',
      posterId: poster.id,
      posterName: poster.email?.split('@')[0] ?? 'Client',
    },
    {
      title: 'UX/UI Designer',
      description: 'Join our product design team to create beautiful and intuitive interfaces.\n\nResponsibilities:\n- Design user flows and wireframes\n- Create high-fidelity mockups\n- Conduct user research',
      shortDescription: 'Design-driven company seeking a creative UX/UI designer for core product work.',
      location: 'San Francisco, CA',
      type: 'full-time',
      salaryRange: '$100k - $140k',
      skills: JSON.stringify(['Figma', 'User Research', 'Prototyping', 'Design Systems']),
      status: 'open',
      posterId: poster.id,
      posterName: poster.email?.split('@')[0] ?? 'Client',
    },
    {
      title: 'Backend Engineer (Contract)',
      description: 'Short-term contract for backend API development.\n\nStack: Node.js, PostgreSQL, Redis\n\nDuration: 3 months with possible extension.',
      shortDescription: 'Contract role for a backend engineer to build scalable APIs.',
      location: 'Remote',
      type: 'contract',
      salaryRange: '$80/hr - $120/hr',
      skills: JSON.stringify(['Node.js', 'PostgreSQL', 'Redis', 'REST APIs']),
      status: 'open',
      posterId: poster.id,
      posterName: poster.email?.split('@')[0] ?? 'Client',
    },
    {
      title: 'Part-time Technical Writer',
      description: 'We need a technical writer to document our API and create tutorials for developers.',
      shortDescription: 'Part-time technical writing role for a developer tools company.',
      location: 'Remote',
      type: 'part-time',
      salaryRange: '$50/hr - $70/hr',
      skills: JSON.stringify(['Technical Writing', 'Markdown', 'API Documentation']),
      status: 'open',
      posterId: poster.id,
      posterName: poster.email?.split('@')[0] ?? 'Client',
    },
    {
      title: 'DevOps Engineer',
      description: 'Help us scale our infrastructure and improve CI/CD pipelines.\n\nResponsibilities:\n- Manage AWS infrastructure\n- Automate deployments\n- Monitor production systems',
      shortDescription: 'Senior DevOps engineer to own cloud infrastructure and deployments.',
      location: 'New York, NY',
      type: 'full-time',
      salaryRange: '$130k - $170k',
      skills: JSON.stringify(['AWS', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD']),
      status: 'open',
      posterId: poster.id,
      posterName: poster.email?.split('@')[0] ?? 'Client',
    },
  ]

  await prisma.jobPost.createMany({ data: jobs })

  return { success: true, message: `${jobs.length} sample jobs created!` }
}
