import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PROVIDER_NAMES } from '@/lib/payments/types'
import type { ProviderName } from '@/lib/payments/types'
import { ProviderStatusCard } from '@/components/payments/provider-status-card'
import { PaymentSettingsForm } from '@/components/payments/payment-settings-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/dashboard')

  const setting = await prisma.paymentSetting.findUnique({
    where: { key: 'active_provider' },
  })
  const activeProvider = (setting?.value as ProviderName) || 'stripe'

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/admin" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
          &larr; Admin Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Payment Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure which payment provider to use for connects purchases.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {PROVIDER_NAMES.map((name) => (
          <ProviderStatusCard key={name} provider={name} isActive={name === activeProvider} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentSettingsForm currentProvider={activeProvider} />
        </CardContent>
      </Card>
    </>
  )
}
