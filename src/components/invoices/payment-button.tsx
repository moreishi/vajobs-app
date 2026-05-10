'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createInvoiceCheckoutSession } from '@/actions/invoice-payments'
import type { ProviderName } from '@/lib/payments'
import { PROVIDER_LABELS } from '@/lib/payments'
import { CreditCardIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

const INVOICE_PROVIDERS: ProviderName[] = ['stripe', 'paypal', 'wise']

export function PaymentButton({ invoiceId }: { invoiceId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<ProviderName | null>(null)

  async function handlePay(provider: ProviderName) {
    setLoadingProvider(provider)
    const result = await createInvoiceCheckoutSession(invoiceId, provider)
    setLoadingProvider(null)
    setIsOpen(false)

    if ('error' in result) {
      toast.error(result.error)
    } else {
      window.location.href = result.redirectUrl
    }
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingProvider !== null}
      >
        {loadingProvider ? (
          <>
            <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
            {PROVIDER_LABELS[loadingProvider]}...
          </>
        ) : (
          <>
            <CreditCardIcon className="mr-1 h-3 w-3" />
            Pay Now
          </>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 shadow-md">
            {INVOICE_PROVIDERS.map((provider) => (
              <button
                key={provider}
                onClick={() => handlePay(provider)}
                disabled={loadingProvider !== null}
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                Pay with {PROVIDER_LABELS[provider]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
