'use client'

import { useState, useRef } from 'react'
import { sendMessage } from '@/actions/applications'
import { Button } from '@/components/ui/button'
import type { Message } from '@/types'

export function MessageForm({
  applicationId,
  onMessageSent,
}: {
  applicationId: string
  onMessageSent?: (message: Message) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const content = (formData.get('content') as string)?.trim()
    const hasFile = file !== null

    if (!content && !hasFile) {
      setError('Message or attachment is required')
      return
    }

    let attachmentUrl: string | null = null
    let attachmentName: string | null = null

    if (hasFile) {
      setUploading(true)
      try {
        const uploadFormData = new FormData()
        uploadFormData.set('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData })
        const data = await res.json()
        if (!res.ok || data.error) {
          setError(data.error || 'Upload failed')
          setUploading(false)
          return
        }
        attachmentUrl = data.url
        attachmentName = file.name
      } catch {
        setError('Upload failed')
        setUploading(false)
        return
      }
    }

    if (attachmentUrl) formData.set('attachmentUrl', attachmentUrl)
    if (attachmentName) formData.set('attachmentName', attachmentName)

    const result = await sendMessage(applicationId, formData)
    setUploading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      formRef.current?.reset()
      setFile(null)
      if (onMessageSent && 'message' in result && result.message) {
        onMessageSent(result.message as unknown as Message)
      }
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <textarea
        name="content"
        rows={3}
        placeholder="Type your message..."
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
      />
      {file && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              setFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="text-xs text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground"
        />
        <Button type="submit" size="sm" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Send'}
        </Button>
      </div>
    </form>
  )
}
