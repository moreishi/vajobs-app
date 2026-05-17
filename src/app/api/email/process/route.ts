import { NextResponse } from 'next/server'
import { processPendingEmails } from '@/lib/email/worker'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processPendingEmails()
  return NextResponse.json(result)
}
