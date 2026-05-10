'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookmarkIcon } from 'lucide-react'
import { createAlert } from '@/actions/saved-search-alerts'
import { toast } from 'sonner'

export function SaveSearchButton({
  type,
  searchParams,
}: {
  type: 'jobs' | 'talents'
  searchParams: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  if (!searchParams) return null

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const params = new URLSearchParams(searchParams)
    const filters: Record<string, string> = {}

    for (const [key, value] of params.entries()) {
      if (key !== 'page') {
        filters[key] = value
      }
    }

    if (Object.keys(filters).length === 0) return

    const result = await createAlert({ type, name: name.trim(), filters })
    setSaving(false)

    if (result.success) {
      toast.success(`Saved search "${name.trim()}"`)
      setOpen(false)
      setName('')
    } else {
      toast.error(result.error || 'Failed to save search')
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
      >
        <BookmarkIcon className="h-4 w-4 mr-1" />
        Save Search
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border bg-popover p-4 shadow-md">
          <p className="text-sm font-medium mb-2">Save this search</p>
          <p className="text-xs text-muted-foreground mb-3">
            Get notified when new results match your current filters.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              placeholder="Search name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
            <Button type="submit" size="sm" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
