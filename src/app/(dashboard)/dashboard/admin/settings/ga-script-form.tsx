'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateGaScript } from '@/actions/admin'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export function GaScriptForm({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const formData = new FormData(e.currentTarget)
      const result = await updateGaScript(formData)
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage('Saved successfully.')
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            name="script"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Paste your Google Analytics script here..."
          />
          {message && (
            <p className={`text-sm ${message === 'Saved successfully.' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {message}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={pending} className={buttonVariants({ size: 'sm' })}>
              {pending ? 'Saving...' : 'Save'}
            </button>
            {value !== initialValue && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
