import { useState, useEffect } from 'react'
import { FiSend } from 'react-icons/fi'

export function ReportChatComposer({ onSend, onTyping, disabled, suggestionText, onSuggestionUsed }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (suggestionText) {
      setContent(suggestionText)
      onSuggestionUsed?.()
    }
  }, [suggestionText, onSuggestionUsed])

  async function submit(event) {
    event.preventDefault()
    const value = content.trim()
    if (!value) return setError('Write a message before sending.')
    if (value.length > 2000) return setError('Messages must be 2,000 characters or fewer.')
    setError('')
    const sent = await onSend(value)
    if (sent) setContent('')
  }
  return <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3">
    {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
    <div className="flex items-end gap-2">
      <textarea value={content} onChange={(event) => { setContent(event.target.value); onTyping?.() }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event) } }} rows={2} maxLength={2000} disabled={disabled} placeholder="Write a message..." className="min-h-12 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60" aria-label="Message" />
      <button type="submit" disabled={disabled} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Send message"><FiSend /></button>
    </div>
  </form>
}

