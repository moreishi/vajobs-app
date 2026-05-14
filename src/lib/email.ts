import { logger } from '@/lib/logger'

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
        from: `VA Jobs Online <${fromEmail}>`,
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      logger.error('Email', `Failed to send to ${to}: ${res.status}`, err)
    }
  } catch (err) {
    logger.error('Email', `Error sending to ${to}`, err instanceof Error ? err.stack : err)
  }
}

export function buildEmailHtml(body: string, cta?: { text: string; url: string }, unsubscribeUrl?: string) {
  const footerUnsubscribe = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:#a1a1aa;text-decoration:underline;font-size:11px">Unsubscribe from these emails</a>`
    : 'If you no longer wish to receive these emails, you can update your preferences in your account settings.'

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
              <tr>
                <td style="padding-bottom:16px;text-align:center">
                  <div style="font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.5px">VA Jobs Online</div>
                </td>
              </tr>
              <tr>
                <td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
                  <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 24px">${body}</p>
                  ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tr><td style="background-color:#18181b;border-radius:8px;padding:12px 24px;text-align:center"><a href="${cta.url}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;display:inline-block">${cta.text}</a></td></tr></table>` : ''}
                  <p style="font-size:13px;line-height:1.5;color:#71717a;margin:0">
                    You received this because you have an account on VA Jobs Online.<br>
                    ${footerUnsubscribe}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:16px;text-align:center">
                  <p style="font-size:11px;color:#a1a1aa;margin:0">&copy; ${new Date().getFullYear()} VA Jobs Online. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getNotificationEmail(type: string, title: string, body?: string, link?: string): { subject: string; body: string } | null {
  const subject = `[VA Jobs Online] ${title}`

  if (body) {
    return {
      subject,
      body,
    }
  }

  return null
}
