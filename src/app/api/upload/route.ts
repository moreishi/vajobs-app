import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getStorageProvider } from '@/lib/storage'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
]
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: PDF, DOC, DOCX, PNG, JPG' },
      { status: 400 },
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 10MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const uniqueName = `${crypto.randomUUID()}${ext ? '.' + ext : ''}`

  const storage = await getStorageProvider()
  const url = await storage.save(file, uniqueName)

  return NextResponse.json({ url })
}
