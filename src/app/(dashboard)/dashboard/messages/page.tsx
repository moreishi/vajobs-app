import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getConversations } from '@/actions/applications'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const conversations = await getConversations()

  return (
    <>
      <Link href="/dashboard" className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>
      <h1 className="mb-8 text-2xl font-bold">Messages</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg text-muted-foreground">No conversations yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages will appear here when you or the other party send a message about an application.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.applicationId} href={`/dashboard/applications/${c.applicationId}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {c.otherPartyName[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.otherPartyName}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTimeAgo(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Re: {c.jobTitle}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {c.lastMessageFromMe ? 'You: ' : ''}{c.lastMessageContent}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

function formatTimeAgo(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return new Date(isoString).toLocaleDateString()
}
