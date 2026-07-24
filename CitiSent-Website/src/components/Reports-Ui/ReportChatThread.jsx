import { useEffect, useRef } from 'react'
import { FiMessageCircle } from 'react-icons/fi'
import { ReportChatMessageItem } from './ReportChatMessageItem'

export function ReportChatThread({ messages, loading, error, profileId }) {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])
  if (loading) return <div className="grid flex-1 place-items-center text-sm text-slate-500">Loading conversation...</div>
  if (error) return <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
  if (!messages.length) return <div className="grid flex-1 place-items-center p-8 text-center text-slate-500"><FiMessageCircle className="mb-2 text-3xl text-slate-300" /><p className="text-sm">No messages yet.</p><p className="text-xs">Start the conversation with the report owner.</p></div>
  return <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((message) => <ReportChatMessageItem key={message.id} message={message} isAdmin={message.senderId === profileId} />)}<div ref={endRef} /></div>
}
