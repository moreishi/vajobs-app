import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { processPendingEmails } from '@/lib/email/worker'

export async function POST() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processPendingEmails()
  return NextResponse.json(result)
}
