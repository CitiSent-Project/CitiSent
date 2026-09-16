import { FiCheck, FiClock } from 'react-icons/fi'

export function ReportChatMessageItem({ message, isOwnMessage }) {
  const date = message.createdAt ? new Date(message.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''
  
  const normalizedRole = String(message.senderRole || '').trim().toLowerCase();
  const isAdminRole = normalizedRole === 'admin' || normalizedRole === 'superadmin' || normalizedRole === 'agency_staff' || normalizedRole === 'office_admin' || normalizedRole === 'office admin' || normalizedRole === 'administrator';
  const isRightSide = isOwnMessage || isAdminRole;

  let bubbleClass = 'rounded-bl-sm border border-slate-200/90 bg-white text-slate-800 shadow-sm dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-200 dark:shadow-none';
  let nameClass = 'text-slate-400 dark:text-slate-500';
  let dateClass = 'text-slate-400 dark:text-slate-500';
  
  if (isOwnMessage) {
    bubbleClass = 'rounded-br-sm bg-blue-700 text-white dark:bg-blue-600';
    nameClass = 'text-blue-100 dark:text-blue-200';
    dateClass = 'text-blue-100 dark:text-blue-200';
  } else if (isAdminRole) {
    bubbleClass = 'rounded-br-sm bg-slate-600 text-white dark:bg-slate-600';
    nameClass = 'text-slate-300 dark:text-slate-400';
    dateClass = 'text-slate-300 dark:text-slate-400';
  }

  let senderLabel = 'User';
  if (isOwnMessage) {
    senderLabel = 'You';
  } else if (isAdminRole) {
    senderLabel = `Admin - ${message.senderName || 'Staff'}`;
  }

  return (
    <div className={`flex min-w-0 max-w-full ${isRightSide ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 rounded-2xl px-4 py-3 shadow-sm ${bubbleClass}`}>
        <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${nameClass}`}>{senderLabel}</p>
        <p className="whitespace-pre-wrap break-all wrap-break-word text-sm leading-relaxed">{message.content}</p>
        <p className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${dateClass}`}>{date}{isRightSide ? (message.isRead ? <FiCheck aria-label="Read" /> : <FiClock aria-label="Sent" />) : null}</p>
      </div>
    </div>
  )
}
