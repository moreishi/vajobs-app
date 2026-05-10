import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { applicationId } = await params

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { applicantId: true, jobPost: { select: { posterId: true } } },
  })
  if (!application) {
    return new Response('Not found', { status: 404 })
  }

  const isParticipant =
    application.applicantId === session.user.id ||
    application.jobPost.posterId === session.user.id
  if (!isParticipant) {
    return new Response('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const since = searchParams.get('since')

  let abort = false
  request.signal.addEventListener('abort', () => {
    abort = true
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let lastPoll = since || new Date(0).toISOString()

      const send = (event: string, data: unknown) => {
        if (abort) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          abort = true
        }
      }

      while (!abort) {
        try {
          const messages = await prisma.message.findMany({
            where: {
              conversation: { applicationId },
              createdAt: { gt: new Date(lastPoll) },
            },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true, email: true } } },
          })

          if (messages.length > 0) {
            const mapped = messages.map((m) => ({
              ...m,
              createdAt: m.createdAt.toISOString(),
            }))
            lastPoll = mapped[mapped.length - 1].createdAt
            send('messages', mapped)
          }
        } catch {
          // Poll failed silently — keep connection alive
        }

        // Heartbeat every 15s to keep connection open
        send('heartbeat', {})

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
