import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      connects: true,
      emailVerified: true,
      createdAt: true,
    },
  })

  const rows = users.map((u) => ({
    ID: u.id,
    Email: u.email,
    Name: u.name || '',
    Role: u.role,
    Connects: u.connects,
    'Email Verified': u.emailVerified ? new Date(u.emailVerified).toISOString() : 'No',
    'Created At': new Date(u.createdAt).toISOString(),
  }))

  return NextResponse.json(rows)
}
