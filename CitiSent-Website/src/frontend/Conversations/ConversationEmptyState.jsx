import { FiMessageCircle, FiInbox } from 'react-icons/fi'

/**
 * ConversationEmptyState
 * ---------------------
 * Renders a placeholder illustration when:
 *   - variant="no-conversations"  → The admin has no conversations yet.
 *   - variant="select"            → No conversation is currently selected (default).
 *
 * Follows the project's existing empty-state pattern (e.g. ReportChatThread).
 */
export function ConversationEmptyState({ variant = 'select' }) {
  if (variant === 'no-conversations') {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100">
            <FiInbox className="text-2xl text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No conversations yet</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Conversations will appear here once you start chatting with citizens from their report pages.
          </p>
        </div>
      </div>
    )
  }

  // Default: "select a conversation" prompt
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blue-50">
          <FiMessageCircle className="text-2xl text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Choose a conversation from the list to view messages and continue chatting.
        </p>
      </div>
    </div>
  )
}
