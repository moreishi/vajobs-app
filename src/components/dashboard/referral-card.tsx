'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import type { ReferralConversionStats } from '@/lib/referrals'

interface ReferralCardProps {
  referralCode: string
  referralEarnings: number
  baseUrl: string
  conversionStats?: ReferralConversionStats
}

export function ReferralCard({ referralCode, referralEarnings, baseUrl, conversionStats }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)
  const shareLink = `${baseUrl}/register?ref=${referralCode}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the input text
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Referral Program</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Share your referral link and earn <strong>10 connects</strong> for each friend who signs up and completes their first action!
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <code className="rounded border bg-muted px-3 py-2 text-sm font-mono text-center sm:text-left flex-1">
            {referralCode}
          </code>
          <div className="flex gap-1 justify-center sm:justify-start">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <a
              href={`mailto:?subject=Join%20me%20on%20VA%20Jobs%20Online&body=Sign%20up%20using%20my%20referral%20link%3A%20${encodeURIComponent(shareLink)}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Share
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Connects earned from referrals</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">+{referralEarnings}</span>
        </div>
        {conversionStats && conversionStats.totalReferrals > 0 && (
          <div className="space-y-2 rounded-lg border p-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversion</span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold">{conversionStats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Referred</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{conversionStats.converted}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{conversionStats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${conversionStats.conversionRate}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground shrink-0">{conversionStats.conversionRate}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
