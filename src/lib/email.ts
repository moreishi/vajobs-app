type EmailPayload = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.EMAIL_FROM || 'noreply@vajobs.online'
  if (!apiKey) return

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Talent Hub <${fromEmail}>`,
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Email] Failed to send:', err)
    }
  } catch (err) {
    console.error('[Email] Error:', err)
  }
}

export function buildEmailHtml(body: string, cta?: { text: string; url: string }) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <div style="font-size:24px;font-weight:700;margin-bottom:24px">Talent Hub</div>
      <p style="font-size:15px;line-height:1.5;color:#374151;margin:0 0 24px">${body}</p>
      ${cta ? `<a href="${cta.url}" style="display:inline-block;background-color:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">${cta.text}</a>` : ''}
      <p style="font-size:12px;color:#9ca3af;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px">
        You received this because you have an account on Talent Hub.
      </p>
    </div>
  `
}

export function getNotificationEmail(type: string, title: string, body?: string, link?: string): { subject: string; body: string } | null {
  const subject = `[Talent Hub] ${title}`

  if (body) {
    return {
      subject,
      body,
    }
  }

  return null
}
