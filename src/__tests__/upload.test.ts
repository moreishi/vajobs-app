import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

const { auth } = await import('@/lib/auth')
const { writeFile, mkdir } = await import('fs/promises')

let POST: typeof import('@/app/api/upload/route').POST

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/app/api/upload/route')
  POST = mod.POST
})

function createMockFile(content: string, name: string, type: string): File {
  return new File([content], name, { type })
}

describe('POST /api/upload', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    const formData = new FormData()
    formData.set('file', createMockFile('test', 'test.pdf', 'application/pdf'))
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Not authenticated')
  })

  it('returns 400 when no file provided', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)

    const formData = new FormData()
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('No file provided')
  })

  it('returns 400 for invalid file type', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)

    const formData = new FormData()
    formData.set('file', createMockFile('bad', 'test.exe', 'application/x-msdownload'))
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid file type')
  })

  it('returns 400 for file too large', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)

    const largeContent = 'x'.repeat(11 * 1024 * 1024)
    const formData = new FormData()
    formData.set('file', createMockFile(largeContent, 'large.pdf', 'application/pdf'))
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('File too large')
  })

  it('uploads file successfully and returns url', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(mkdir).mockResolvedValueOnce(undefined as any)
    vi.mocked(writeFile).mockResolvedValueOnce(undefined as any)

    const formData = new FormData()
    formData.set('file', createMockFile('resume content', 'my-resume.pdf', 'application/pdf'))
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.url).toMatch(/^\/uploads\/.+\.pdf$/)
    expect(mkdir).toHaveBeenCalled()
    expect(writeFile).toHaveBeenCalled()
  })
})
