import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TalentOnboarding, ClientOnboarding } from '@/components/onboarding/onboarding-wizard'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const role = session.user.role

  // Only talent and client need onboarding
  if (role !== 'talent' && role !== 'client') redirect('/dashboard')

  // Check if onboarding is already completed
  if (role === 'talent') {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { headline: true, bio: true },
    })
    if (profile?.headline && profile?.bio) redirect('/dashboard')
  }

  if (role === 'client') {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      select: { company: true },
    })
    if (clientProfile?.company) redirect('/dashboard')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            {role === 'talent' ? 'Set Up Your Profile' : 'Set Up Your Company Profile'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {role === 'talent'
              ? 'Help clients discover your skills and experience.'
              : 'Help talent learn about your company and what you offer.'}
          </p>
        </div>
        {role === 'talent' ? <TalentOnboarding /> : <ClientOnboarding />}
      </div>
    </div>
  )
}
