import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.SENTRY_DSN) {
    await import('../sentry.server.config')
  }
}

export const onRequestError = Sentry.captureRequestError
