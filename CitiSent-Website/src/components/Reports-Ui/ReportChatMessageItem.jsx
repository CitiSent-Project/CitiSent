import { FiCheck, FiClock } from 'react-icons/fi'

export function ReportChatMessageItem({ message, isAdmin }) {
  const date = message.createdAt ? new Date(message.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${isAdmin ? 'rounded-br-sm bg-blue-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'}`}>
        <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${isAdmin ? 'text-blue-100' : 'text-slate-400'}`}>{isAdmin ? 'You' : message.senderName}</p>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isAdmin ? 'text-blue-100' : 'text-slate-400'}`}>
          {date}{isAdmin ? (message.isRead ? <FiCheck aria-label="Read" /> : <FiClock aria-label="Sent" />) : null}
        </p>
      </div>
    </div>
  )
}
