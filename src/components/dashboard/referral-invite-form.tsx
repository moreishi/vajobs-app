'use client'

import { useState, useRef } from 'react'
import { sendReferralInvite } from '@/actions/referrals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ReferralInviteForm({ baseUrl }: { baseUrl: string }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setStatus(null)

    const result = await sendReferralInvite(email.trim(), baseUrl)

    if ('error' in result) {
      setStatus({ type: 'error', message: result.error })
    } else {
      setStatus({ type: 'success', message: 'Invite sent!' })
      setEmail('')
      formRef.current?.reset()
    }
    setIsLoading(false)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          id="invite-email"
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 min-w-0"
        />
        <Button type="submit" disabled={isLoading || !email.trim()}>
          {isLoading ? 'Sending...' : 'Send Invite'}
        </Button>
      </div>
      {status && (
        <p className={`text-sm ${status.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {status.message}
        </p>
      )}
    </form>
  )
}
