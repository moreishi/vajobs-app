import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('buildEmailHtml', () => {
  let buildEmailHtml: typeof import('@/lib/email').buildEmailHtml

  beforeEach(async () => {
    const mod = await import('@/lib/email')
    buildEmailHtml = mod.buildEmailHtml
  })

  it('returns HTML with body text', () => {
    const html = buildEmailHtml('Your application has been received')
    expect(html).toContain('Your application has been received')
    expect(html).toContain('Talent Hub')
    expect(html).toContain('You received this because you have an account')
  })

  it('includes CTA button when provided', () => {
    const html = buildEmailHtml('Body text', { text: 'View Dashboard', url: 'https://example.com/dashboard' })
    expect(html).toContain('View Dashboard')
    expect(html).toContain('https://example.com/dashboard')
    expect(html).toContain('background-color:#000')
  })

  it('does not include CTA when not provided', () => {
    const html = buildEmailHtml('Body text')
    expect(html).not.toContain('background-color:#000')
  })
})

describe('getNotificationEmail', () => {
  let getNotificationEmail: typeof import('@/lib/email').getNotificationEmail

  beforeEach(async () => {
    const mod = await import('@/lib/email')
    getNotificationEmail = mod.getNotificationEmail
  })

  it('returns subject and body when body is provided', () => {
    const result = getNotificationEmail('application_received', 'New Application', 'Someone applied')
    expect(result).toEqual({ subject: '[Talent Hub] New Application', body: 'Someone applied' })
  })

  it('returns null when body is not provided', () => {
    const result = getNotificationEmail('application_received', 'New Application')
    expect(result).toBeNull()
  })
})

describe('sendEmail', () => {
  let sendEmail: typeof import('@/lib/email').sendEmail
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(async () => {
    const mod = await import('@/lib/email')
    sendEmail = mod.sendEmail
    originalEnv = process.env
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('skips sending when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Hi</p>' })

    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('sends email via Resend API when key is set', async () => {
    process.env.RESEND_API_KEY = 're_abc123'
    process.env.EMAIL_FROM = 'noreply@vajobs.online'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true } as Response)

    await sendEmail({ to: 'test@example.com', subject: 'Test Subject', html: '<p>Hi</p>' })

    expect(fetchSpy).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_abc123',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Talent Hub <noreply@vajobs.online>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Hi</p>',
      }),
    })
    fetchSpy.mockRestore()
  })

  it('logs error when Resend API returns non-ok', async () => {
    process.env.RESEND_API_KEY = 're_abc123'
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Rate limit exceeded'),
    } as Response)

    await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Hi</p>' })

    expect(consoleSpy).toHaveBeenCalledWith('[Email] Failed to send:', 'Rate limit exceeded')
    consoleSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  it('logs error on network failure', async () => {
    process.env.RESEND_API_KEY = 're_abc123'
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Hi</p>' })

    expect(consoleSpy).toHaveBeenCalledWith('[Email] Error:', expect.any(Error))
    consoleSpy.mockRestore()
    fetchSpy.mockRestore()
  })
})
