import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-muted-foreground">This reset link is missing or invalid.</p>
          <Link href="/forgot-password" className="text-primary underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ResetPasswordForm token={token} />
    </div>
  )
}
