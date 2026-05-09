import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PROVIDER_LABELS, PROVIDER_NAMES } from '@/lib/payments/types'
import type { ProviderName } from '@/lib/payments/types'
import { checkProviderConfigured } from '@/lib/payments/registry'

const PROVIDER_WEBHOOK_PATHS: Record<ProviderName, string> = {
  stripe: '/api/payments/stripe/webhook',
  paypal: '/api/payments/paypal/webhook',
  hitpay: '/api/payments/hitpay/webhook',
  xendit: '/api/payments/xendit/webhook',
}

export function ProviderStatusCard({ provider, isActive }: { provider: ProviderName; isActive: boolean }) {
  const configured = checkProviderConfigured(provider)
  const authUrl = process.env.AUTH_URL || 'http://localhost:3000'
  const webhookUrl = `${authUrl}${PROVIDER_WEBHOOK_PATHS[provider]}`

  return (
    <Card className={isActive ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{PROVIDER_LABELS[provider]}</CardTitle>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Active
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              configured
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {configured ? 'Configured' : 'Not Configured'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Webhook URL:</span>
          <code className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">{webhookUrl}</code>
        </div>
        {!configured && (
          <p className="text-xs text-muted-foreground">
            Set the required environment variables for this provider to enable it.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
