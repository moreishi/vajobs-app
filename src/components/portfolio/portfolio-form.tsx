'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addPortfolioItem, deletePortfolioItem, type PortfolioItemData } from '@/actions/portfolio'
import { toast } from 'sonner'
import { Trash2Icon, PlusIcon } from 'lucide-react'

const ITEM_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'certification', label: 'Certification' },
  { value: 'work_sample', label: 'Work Sample' },
  { value: 'link', label: 'Link' },
]

export function PortfolioManager({ items }: { items: PortfolioItemData[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('project')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)

    const result = await addPortfolioItem({
      title: title.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      type,
    })

    setSaving(false)
    if (result.success) {
      toast.success('Portfolio item added')
      setTitle('')
      setDescription('')
      setUrl('')
      setType('project')
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to add item')
    }
  }

  async function handleDelete(itemId: string) {
    setDeleting(itemId)
    const result = await deletePortfolioItem(itemId)
    setDeleting(null)
    if (result.success) {
      toast.success('Portfolio item removed')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Portfolio</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(!open)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 ? (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      View
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No portfolio items yet.
          </p>
        )}

        {open && (
          <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
            <div>
              <Label htmlFor="title" className="text-xs">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project name..." required className="h-8 text-sm" />
            </div>
            <div>
              <Label htmlFor="type" className="text-xs">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="url" className="text-xs">URL (optional)</Label>
              <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs">Description (optional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" size="sm" disabled={saving || !title.trim()}>
              {saving ? 'Adding...' : 'Add'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
