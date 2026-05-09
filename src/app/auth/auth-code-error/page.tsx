import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <p className="text-muted-foreground">Something went wrong during authentication. Please try again.</p>
      <Link href="/login" className={buttonVariants()}>Back to login</Link>
    </div>
  )
}
