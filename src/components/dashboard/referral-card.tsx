'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReferralCardProps {
  referralCode: string
  referralEarnings: number
  baseUrl: string
}

export function ReferralCard({ referralCode, referralEarnings, baseUrl }: ReferralCardProps) {
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
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded border bg-muted px-3 py-2 text-sm font-mono">
            {referralCode}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Connects earned from referrals</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">+{referralEarnings}</span>
        </div>
      </CardContent>
    </Card>
  )
}
