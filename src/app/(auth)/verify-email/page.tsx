import Link from 'next/link'
import { VerifyEmailForm } from '@/components/auth/verify-email-form'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Invalid verification link</h1>
          <p className="text-muted-foreground">This verification link is missing or invalid.</p>
          <Link href="/login" className="text-primary underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <VerifyEmailForm token={token} />
    </div>
  )
}
