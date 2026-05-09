'use client'

import { useState, useRef } from 'react'
import { sendMessage } from '@/actions/applications'
import { Button } from '@/components/ui/button'

export function MessageForm({ applicationId }: { applicationId: string }) {
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const content = formData.get('content') as string
    if (!content?.trim()) {
      setError('Message cannot be empty')
      return
    }

    const result = await sendMessage(applicationId, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      formRef.current?.reset()
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <textarea
        name="content"
        rows={3}
        placeholder="Type your message..."
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm">
        Send Message
      </Button>
    </form>
  )
}
