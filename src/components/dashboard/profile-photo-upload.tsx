'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileImage } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfilePhotoUploadProps {
  currentImage: string | null
  userName: string | null
}

export function ProfilePhotoUpload({ currentImage, userName }: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const displayUrl = preview || currentImage

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Only PNG and JPG files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB')
      return
    }

    setError(null)
    setPreview(URL.createObjectURL(file))
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        setUploading(false)
        return
      }

      const result = await updateProfileImage(data.url)
      if (result.error) {
        setError(result.error)
        setUploading(false)
        return
      }

      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    setUploading(true)
    const result = await updateProfileImage('')
    if (result.error) {
      setError(result.error)
    } else {
      setPreview(null)
      router.refresh()
    }
    setUploading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {displayUrl ? (
            <img src={displayUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {(userName || '?')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {preview && (
            <Button size="sm" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Save Photo'}
            </Button>
          )}
          {!preview && currentImage && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="block text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
