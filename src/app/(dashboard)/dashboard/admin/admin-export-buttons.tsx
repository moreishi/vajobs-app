'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function AdminExportButtons() {
  const [exporting, setExporting] = useState<'users' | 'connects' | null>(null)

  async function exportUsers() {
    setExporting('users')
    try {
      const { exportToCsv } = await import('@/lib/csv')
      const res = await fetch('/api/admin/export/users')
      const data = await res.json()
      exportToCsv(`users-${new Date().toISOString().split('T')[0]}.csv`, data)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  async function exportConnects() {
    setExporting('connects')
    try {
      const { exportToCsv } = await import('@/lib/csv')
      const res = await fetch('/api/admin/export/connects')
      const data = await res.json()
      exportToCsv(`connects-${new Date().toISOString().split('T')[0]}.csv`, data)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={exportUsers} disabled={exporting === 'users'}>
        {exporting === 'users' ? 'Exporting...' : 'Export Users'}
      </Button>
      <Button variant="outline" size="sm" onClick={exportConnects} disabled={exporting === 'connects'}>
        {exporting === 'connects' ? 'Exporting...' : 'Export Connects'}
      </Button>
    </div>
  )
}
