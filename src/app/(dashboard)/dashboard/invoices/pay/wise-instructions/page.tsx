import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { ExternalLinkIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WiseInstructionsPage(props: {
  searchParams: Promise<{ paymentOrderId?: string; quoteId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { paymentOrderId, quoteId } = await props.searchParams
  if (!paymentOrderId) redirect('/dashboard/engagements')

  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { id: paymentOrderId },
    select: {
      id: true,
      priceInCents: true,
      currency: true,
      description: true,
      status: true,
      userId: true,
      invoiceId: true,
      invoice: {
        select: {
          id: true,
          engagementId: true,
          contractId: true,
          amount: true,
        },
      },
    },
  })

  if (!paymentOrder || paymentOrder.userId !== session.user.id) {
    redirect('/dashboard/engagements')
  }

  const dollarAmount = (paymentOrder.priceInCents / 100).toFixed(2)
  const engagementUrl = paymentOrder.invoice?.engagementId
    ? ROUTES.ENGAGEMENT_DETAIL(paymentOrder.invoice.engagementId)
    : '/dashboard/engagements'

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <Link href={engagementUrl} className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to Engagement
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ExternalLinkIcon className="h-5 w-5 text-primary" />
            Pay by Bank Transfer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-4">
            <h3 className="mb-2 text-sm font-medium">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">${dollarAmount} {paymentOrder.currency.toUpperCase()}</span>
              </div>
              {paymentOrder.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span>{paymentOrder.description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-yellow-600 dark:text-yellow-400">Pending payment</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-950">
            <h3 className="font-medium text-blue-800 dark:text-blue-300">Bank Transfer Instructions</h3>
            <ol className="ml-4 list-decimal space-y-2 text-blue-700 dark:text-blue-400">
              <li>
                {quoteId ? (
                  <>
                    A Wise quote has been created (ID: {quoteId.slice(0, 8)}...).
                  </>
                ) : (
                  <>Configure your Wise API keys in the environment variables to enable automatic payment link generation.</>
                )}
              </li>
              <li>Transfer <strong>${dollarAmount} {paymentOrder.currency.toUpperCase()}</strong> to the Wise bank account details shown in your Wise dashboard.</li>
              <li>Include the payment reference: <code className="rounded bg-blue-100 px-1 py-0.5 text-xs dark:bg-blue-900">{paymentOrder.id.slice(0, 12)}</code></li>
              <li>Once the transfer completes, the invoice will be automatically marked as paid.</li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground">
            Bank transfers typically take 1-3 business days to process. The invoice status will update automatically when the payment is received via Wise. No Wise account? Sign up at{' '}
            <a href="https://wise.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              wise.com
            </a>
          </p>

          <div className="flex gap-3">
            <Link href={engagementUrl}>
              <Button variant="outline" size="sm">Back to Engagement</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
