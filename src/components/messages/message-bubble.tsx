import type { Message } from '@/types'
import { FormattedDate } from '@/components/ui/formatted-date'

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
        {message.content && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        )}
        {message.attachmentUrl && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 flex items-center gap-1.5 text-xs underline ${
              isOwn ? 'text-primary-foreground/80' : 'text-primary'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>
            {message.attachmentName || 'Attachment'}
          </a>
        )}
        <p
          className={`mt-1 text-[10px] ${
            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          <FormattedDate date={message.createdAt} type="datetime" />
        </p>
      </div>
    </div>
  )
}
