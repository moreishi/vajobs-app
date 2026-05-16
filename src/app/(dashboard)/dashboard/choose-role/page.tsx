import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ChooseRoleForm } from '@/components/auth/choose-role-form'

export default async function ChooseRolePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role
  if (role !== 'guest') redirect('/dashboard')

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to VA Jobs Online!</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us how you&apos;d like to use the platform so we can tailor your experience.
          </p>
        </div>
        <ChooseRoleForm />
      </div>
    </div>
  )
}
