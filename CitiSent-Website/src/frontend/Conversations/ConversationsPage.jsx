import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowLeft, FiFileText, FiRefreshCw, FiSearch, FiChevronDown, FiChevronUp, FiFilter } from 'react-icons/fi'
import { ReportChatComposer } from '../../components/Reports-Ui/ReportChatComposer'
import { ReportChatThread } from '../../components/Reports-Ui/ReportChatThread'
import { mapBackendReportToUiRow } from '../../services/api/admin/reportsApiMappers'
import { useConversationsState } from '../../hooks/useConversationsState'
import { ConversationEmptyState } from './ConversationEmptyState'
import { ConversationListItem } from './ConversationListItem'

const MotionDiv = motion.div

function formatLastSeen(dateString) {
  if (!dateString) return 'Offline'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Offline'

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMins < 1) return 'Active just now'
  if (diffMins < 60) return `Last seen ${diffMins}m ago`
  if (diffHours < 24) return `Last seen ${diffHours}h ago`
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

export function ConversationsPage({ profile, onViewReport, onSyncConversations }) {
  const {
    activeConversation,
    chatError,
    chatLoading,
    conversationsError,
    conversationsLoading,
    fetchSuggestions,
    filteredConversations,
    handleComposerTyping,
    handleSelectConversation,
    handleSend,
    isUserTyping,
    loadConversations,
    loadMessages,
    messages,
    mobileShowChat,
    searchQuery,
    sending,
    setMobileShowChat,
    setSearchQuery,
    showSuggestions,
    suggestions,
    suggestionsLoading,
    totalUnread,
  } = useConversationsState({ profile, onSyncConversations })

  const [isSuggestionsMinimized, setIsSuggestionsMinimized] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)

  return (
    <main className="mx-auto max-w-400 flex-1 bg-[#eef2f8] dark:bg-slate-950 px-4 py-6 md:px-6 lg:px-8" id="conversations-page">
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sm:my-4 sm:h-[calc(100vh-6rem)]">
        
        <div className={`flex w-full flex-col border-r border-slate-200 dark:border-slate-800 md:w-90 md:shrink-0 lg:w-95 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Conversations</h1>
              <button onClick={() => { setUnreadOnly(!unreadOnly); loadConversations() }} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${unreadOnly ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                <FiFilter /> Unread
              </button>
            </div>
            <div className="relative mt-3">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search conversations..." className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20" aria-label="Search conversations" id="conversations-search" />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {conversationsLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                    <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2"><div className="h-3 w-24 rounded bg-slate-200" /><div className="h-2.5 w-40 rounded bg-slate-100" /></div>
                  </div>
                ))}
              </div>
            ) : conversationsError ? (
              <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-sm font-medium text-red-700">{conversationsError}</p>
                <button type="button" onClick={loadConversations} className="mt-2 text-xs font-semibold text-red-600 underline hover:text-red-800">Try again</button>
              </div>
            ) : filteredConversations.length === 0 ? (
              searchQuery ? <div className="p-6 text-center text-sm text-slate-500">No conversations matching "{searchQuery}"</div> : <ConversationEmptyState variant="no-conversations" />
            ) : (
              <div className="space-y-0.5">
                {filteredConversations.map((conversation) => (
                  <ConversationListItem key={conversation.reportId} conversation={conversation} isActive={activeConversation?.reportId === conversation.reportId} onClick={() => handleSelectConversation(conversation)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`flex flex-1 min-w-0 flex-col ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              <header className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-[#183b68] dark:bg-slate-950 px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-white gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition hover:bg-white/10 md:hidden"
                    aria-label="Back to conversations list"
                  >
                    <FiArrowLeft className="text-base" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="font-semibold text-sm sm:text-base truncate text-white">
                        {activeConversation.userName}
                      </h2>
                      {activeConversation.isOnline ? (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] sm:text-[11px] font-medium text-blue-200 truncate max-w-28">
                          {formatLastSeen(activeConversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] sm:text-xs text-blue-100/90 font-medium">
                      Report {activeConversation.reportNumber || (activeConversation.reportId ? `${String(activeConversation.reportId).slice(0, 8)}…` : '')}
                      {activeConversation.category ? ` · ${activeConversation.category}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onViewReport && (
                    <button
                      type="button"
                      onClick={() => onViewReport(mapBackendReportToUiRow(activeConversation.rawReport))}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium transition hover:bg-white/10 active:scale-95"
                      aria-label="View full report"
                      title="View full report"
                    >
                      <FiFileText className="text-sm shrink-0" />
                      <span className="hidden sm:inline">View Report</span>
                      <span className="sm:hidden text-[11px]">Report</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { loadMessages(activeConversation.reportId); fetchSuggestions(activeConversation.reportId) }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/15 transition hover:bg-white/10 active:scale-95"
                    aria-label="Refresh chat"
                    title="Refresh chat"
                  >
                    <FiRefreshCw className="text-xs" />
                  </button>
                </div>
              </header>

              <ReportChatThread messages={messages} loading={chatLoading} error={chatError} profileId={profile?.id} />
              {isUserTyping && <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-xs italic text-slate-500 dark:text-slate-400 font-medium">{activeConversation.userName} is typing...</div>}

              <AnimatePresence>
                {showSuggestions && (
                  <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                        <button 
                          type="button" 
                          onClick={() => setIsSuggestionsMinimized(prev => !prev)}
                          className="flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          aria-label={isSuggestionsMinimized ? "Expand suggestions" : "Minimize suggestions"}
                        >
                          {isSuggestionsMinimized ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}
                          <span>AI-ASSISTED REPLY SUGGESTIONS</span>
                        </button>
                        
                        {!isSuggestionsMinimized && (
                          <button type="button" onClick={() => fetchSuggestions(activeConversation.reportId, true)} disabled={suggestionsLoading} className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition disabled:opacity-50 text-[10px] text-slate-500 dark:text-slate-400 font-bold"><FiRefreshCw className={suggestionsLoading ? 'animate-spin' : ''} /> REGENERATE</button>
                        )}
                      </div>
                      
                      {!isSuggestionsMinimized && (
                        suggestionsLoading ? <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Generating suggestions...</div> : suggestions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {suggestions.map((suggestion, index) => (
                              <button key={index} type="button" onClick={() => !sending && handleSend(suggestion.text)} disabled={sending} className={`flex flex-col justify-between text-left text-xs p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-all text-slate-700 dark:text-slate-300 font-normal wrap-anywhere shadow-2xs ${index === 0 ? 'border-l-4 border-l-blue-600 dark:border-l-blue-500 font-medium text-slate-900 dark:text-white bg-blue-50/10 dark:bg-blue-500/5' : ''}`}>
                                {index === 0 && <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block mb-1 uppercase tracking-wide">Recommended</span>}
                                <span>{suggestion.text}</span>
                              </button>
                            ))}
                          </div>
                        ) : <div className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">No suggestions available.</div>
                      )}
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
              <ReportChatComposer onSend={handleSend} onTyping={handleComposerTyping} disabled={sending || chatLoading} suggestionText="" onSuggestionUsed={() => {}} />
            </>
          ) : <ConversationEmptyState variant="select" />}
        </div>
      </div>
    </main>
  )
}
