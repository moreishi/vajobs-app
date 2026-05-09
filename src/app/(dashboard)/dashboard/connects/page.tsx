import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckoutButton } from '@/components/payments/checkout-button'
import { getActiveProvider } from '@/lib/payments/registry'
import { PROVIDER_LABELS } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'

export default async function ConnectsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'talent' && session.user.role !== 'admin') redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { connects: true },
  })

  const { name: activeProviderName } = await getActiveProvider()
  const providerLabel = PROVIDER_LABELS[activeProviderName]

  const { getConnectHistory } = await import('@/actions/connects')
  const { transactions, total } = await getConnectHistory(1, 50)

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Connects</h1>

      {/* Balance Card */}
      <Card className="mb-8">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="mt-1 text-5xl font-bold">{user?.connects ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">connects</p>
        </CardContent>
      </Card>

      {/* Purchase */}
      <Card className="mb-8">
        <CardHeader><CardTitle>Buy Connects</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Payments processed via {providerLabel}
          </p>
          <CheckoutButton providerName={activeProviderName} />
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Transaction History {total > 0 && <span className="text-sm font-normal text-muted-foreground">({total})</span>}</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[400px] divide-y">
                <div className="grid grid-cols-4 gap-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Date</span>
                  <span>Type</span>
                  <span>Description</span>
                  <span className="text-right">Amount</span>
                </div>
                {transactions.map((tx) => (
                  <div key={tx.id} className="grid grid-cols-4 gap-4 py-3 text-sm items-center">
                    <span className="text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    <span className="capitalize">{tx.type}</span>
                    <span className="truncate text-muted-foreground">{tx.description || '-'}</span>
                    <span className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
