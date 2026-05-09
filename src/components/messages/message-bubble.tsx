import type { Message } from '@/types'

export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 ${
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {!isOwn && message.sender && (
          <p className="mb-0.5 text-xs font-medium opacity-70">
            {message.sender.name || message.sender.email}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        <p
          className={`mt-1 text-[10px] ${
            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
