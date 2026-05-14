import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { label, message, meta } = await req.json()
    logger.error(label || 'Client', message || 'Client-side error', meta)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('Log API', 'Failed to process client log', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
