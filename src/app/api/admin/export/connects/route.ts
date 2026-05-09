import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transactions = await prisma.connectTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, name: true } },
    },
  })

  const rows = transactions.map((tx) => ({
    ID: tx.id,
    'User Email': tx.user.email,
    'User Name': tx.user.name || '',
    Type: tx.type,
    Amount: tx.amount,
    Description: tx.description || '',
    'Created At': new Date(tx.createdAt).toISOString(),
  }))

  return NextResponse.json(rows)
}
