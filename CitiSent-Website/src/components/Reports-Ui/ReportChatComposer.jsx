
import { useState, useEffect } from 'react'
import { FiSend } from 'react-icons/fi'

export function ReportChatComposer({ onSend, onTyping, disabled, suggestionText, onSuggestionUsed }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (suggestionText) {
      const timer = setTimeout(() => {
        setContent(suggestionText)
        onSuggestionUsed?.()
      }, 0)
      return () => clearTimeout(timer)
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
  return <form onSubmit={submit} className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
    {error ? <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    <div className="flex items-end gap-2">
      <textarea value={content} onChange={(event) => { setContent(event.target.value); onTyping?.() }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event) } }} rows={2} maxLength={2000} disabled={disabled} placeholder="Write a message..." className="min-h-12 flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20 disabled:opacity-60" aria-label="Message" />
      <button type="submit" disabled={disabled} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-900/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:bg-blue-600 dark:hover:bg-blue-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-600" aria-label="Send message"><FiSend /></button>
    </div>
  </form>
}

