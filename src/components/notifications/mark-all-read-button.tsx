'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markAllAsRead } from '@/actions/notifications'
import { Button } from '@/components/ui/button'

export function MarkAllReadButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setIsLoading(true)
    await markAllAsRead()
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Marking...' : 'Mark all as read'}
    </Button>
  )
}
