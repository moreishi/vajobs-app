'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getMessages } from '@/actions/chat'
import { MessageBubble } from '@/components/messages/message-bubble'
import { MessageForm } from '@/components/messages/message-form'
import type { Message } from '@/types'

export function ChatMessages({
  applicationId,
  currentUserId,
  initialMessages,
}: {
  applicationId: string
  currentUserId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newCount, setNewCount] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [connected, setConnected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const messagesRef = useRef(messages)
  const eventSourceRef = useRef<EventSource | null>(null)

  messagesRef.current = messages

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
      isAtBottomRef.current = atBottom
      setIsAtBottom(atBottom)
      if (atBottom) setNewCount(0)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isAtBottom) scrollToBottom()
  }, [messages, isAtBottom, scrollToBottom])

  // Real-time via SSE, fallback to polling
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    function connectSSE() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const latest = messagesRef.current[messagesRef.current.length - 1]
      const since = latest?.createdAt || ''
      const url = `/api/chat/${applicationId}/stream${since ? `?since=${encodeURIComponent(since)}` : ''}`

      const es = new EventSource(url)
      eventSourceRef.current = es

      es.addEventListener('messages', (event) => {
        try {
          const newMsgs: Message[] = JSON.parse(event.data)
          if (newMsgs.length === 0) return

          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const filtered = newMsgs.filter((m) => !existingIds.has(m.id))
            if (filtered.length === 0) return prev

            if (!isAtBottomRef.current) {
              setNewCount((c) => c + filtered.length)
            }

            return [...prev, ...filtered]
          })
        } catch {
          // Ignore parse errors
        }
      })

      es.addEventListener('heartbeat', () => {
        setConnected(true)
      })

      es.onerror = () => {
        setConnected(false)
        es.close()
        eventSourceRef.current = null

        // Fallback to polling if SSE fails
        if (!pollInterval) {
          pollInterval = setInterval(pollMessages, 4000)
        }

        // Retry SSE after 30s
        reconnectTimeout = setTimeout(() => {
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
          connectSSE()
        }, 30000)
      }

      es.onopen = () => {
        setConnected(true)
        // Clear polling if SSE connected
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
      }
    }

    async function pollMessages() {
      const latest = messagesRef.current[messagesRef.current.length - 1]
      const result = await getMessages(applicationId, latest?.createdAt)

      if (result.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newMsgs = result.filter((m) => !existingIds.has(m.id))
          if (newMsgs.length === 0) return prev

          if (!isAtBottomRef.current) {
            setNewCount((c) => c + newMsgs.length)
          }

          return [...prev, ...newMsgs]
        })
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (pollInterval) clearInterval(pollInterval)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [applicationId])

  function handleMessageSent(message: Message) {
    setMessages((prev) => [...prev, message])
    scrollToBottom()
  }

  return (
    <div className="space-y-4">
      <div
        ref={scrollRef}
        className="max-h-[400px] space-y-3 overflow-y-auto pr-1"
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Send a message below.
          </p>
        )}
      </div>

      {newCount > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setNewCount(0)
              scrollToBottom()
            }}
            className="rounded-full bg-primary px-4 py-1 text-xs text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            {newCount} new message{newCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <MessageForm applicationId={applicationId} onMessageSent={handleMessageSent} />
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
            connected ? 'bg-green-500' : 'bg-yellow-400'
          }`}
          title={connected ? 'Connected' : 'Reconnecting...'}
        />
      </div>
    </div>
  )
}
