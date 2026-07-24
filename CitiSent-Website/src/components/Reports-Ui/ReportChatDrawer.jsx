import { useCallback, useEffect, useState } from 'react'
import { FiMessageCircle, FiRefreshCw, FiX } from 'react-icons/fi'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import { mapBackendMessagesResponse } from '../../services/api/admin/reportsApiMappers'
import { ReportChatThread } from './ReportChatThread'
import { ReportChatComposer } from './ReportChatComposer'
import { subscribeToReportMessages } from '../../services/realtime/reportMessagesRealtime'

export function ReportChatDrawer({ report, profile, token, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await reportsApiService.listReportMessages(token, report.id); setMessages(mapBackendMessagesResponse(response)); await reportsApiService.markReportMessagesRead(token, report.id) } catch (err) { setError(err.message) } finally { setLoading(false) } }, [report.id, token])
  useEffect(() => { load() }, [load])
  useEffect(() => subscribeToReportMessages({ reportId: report.id, onChange: load }), [load, report.id])
  async function send(content) { setSending(true); try { const response = await reportsApiService.sendReportMessage(token, report.id, content); const sent = mapBackendMessagesResponse(response); if (sent[0]) setMessages((current) => [...current, sent[0]]); else await load(); return true } catch (err) { setError(err.message); return false } finally { setSending(false) } }
  return <><div className="fixed inset-0 z-40 bg-slate-900/20" onClick={onClose} aria-hidden="true" /><aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Report chat">
    <header className="flex items-start justify-between border-b border-slate-200 bg-[#183b68] p-4 text-white"><div><div className="flex items-center gap-2"><FiMessageCircle /><h2 className="font-semibold">Talk to User</h2></div><p className="mt-1 text-xs text-blue-100">Report {report.id} · {report.category}</p></div><div className="flex gap-1"><button type="button" onClick={load} className="rounded-lg p-2 hover:bg-white/10" aria-label="Refresh conversation"><FiRefreshCw /></button><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close chat"><FiX /></button></div></header>
    <ReportChatThread messages={messages} loading={loading} error={error} profileId={profile?.id} /><ReportChatComposer onSend={send} disabled={sending || loading} />
  </aside></>
}
