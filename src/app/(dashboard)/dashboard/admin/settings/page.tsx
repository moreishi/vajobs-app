import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getGaScript } from '@/actions/admin'
import { GaScriptForm } from './ga-script-form'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const gaScript = await getGaScript()

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
          &larr; Admin Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Site Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage global site settings and integrations.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-1">Google Analytics</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Paste your full Google Analytics tracking script below. It will be injected into every page before the closing body tag.
          </p>
          <GaScriptForm initialValue={gaScript || ''} />
        </section>
      </div>
    </>
  )
}
