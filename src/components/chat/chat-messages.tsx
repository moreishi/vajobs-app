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
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const messagesRef = useRef(messages)

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

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
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
    }, 4000)

    return () => clearInterval(interval)
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

      <MessageForm applicationId={applicationId} onMessageSent={handleMessageSent} />
    </div>
  )
}
