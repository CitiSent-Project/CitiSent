/* @vitest-environment jsdom */
import { act, createElement, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useConversationsState } from '../useConversationsState'

const mocks = vi.hoisted(() => ({
  getSocket: vi.fn(),
  joinReportRoom: vi.fn(),
  listConversations: vi.fn(),
  listReportMessages: vi.fn(),
  markReportMessagesRead: vi.fn(),
  getReportChatSuggestions: vi.fn(),
  mapConversations: vi.fn(),
  mapMessages: vi.fn(),
  mapSuggestions: vi.fn(),
  notifyChatMessage: vi.fn(),
}))

vi.mock('../../services/storageService', () => ({
  loadFromStorageWithSchema: vi.fn(() => 'access-token'),
}))

vi.mock('../../services/api/admin/reportsApiService', () => ({
  reportsApiService: {
    listConversations: mocks.listConversations,
    listReportMessages: mocks.listReportMessages,
    markReportMessagesRead: mocks.markReportMessagesRead,
    getReportChatSuggestions: mocks.getReportChatSuggestions,
    sendReportMessage: vi.fn(),
  },
}))

vi.mock('../../services/api/admin/reportsApiMappers', () => ({
  mapBackendConversationsResponse: mocks.mapConversations,
  mapBackendMessagesResponse: mocks.mapMessages,
  mapBackendMessageToUi: vi.fn(),
  mapBackendSuggestionsToUi: mocks.mapSuggestions,
}))

vi.mock('../../services/socket/socketService', () => ({
  getSocket: mocks.getSocket,
  joinReportRoom: mocks.joinReportRoom,
  markSocketConversationRead: vi.fn(),
  sendSocketMessage: vi.fn(),
  sendSocketStopTyping: vi.fn(),
  sendSocketTyping: vi.fn(),
}))

vi.mock('../../components/ui/toastHelpers', () => ({
  notifyChatMessage: mocks.notifyChatMessage,
}))

let container
let root
let latestState

function HookHarness() {
  const state = useConversationsState({ profile: { id: 'admin-1' } })

  useEffect(() => {
    latestState = state
  })

  return null
}

describe('useConversationsState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    latestState = null
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    mocks.getSocket.mockReturnValue({ on: vi.fn(), off: vi.fn() })
    mocks.listConversations.mockResolvedValue({ data: [] })
    mocks.mapConversations.mockReturnValue([])
    mocks.listReportMessages.mockResolvedValue({ data: [] })
    mocks.mapMessages.mockReturnValue([])
    mocks.getReportChatSuggestions.mockResolvedValue({ data: { suggestedReplies: [] } })
    mocks.mapSuggestions.mockReturnValue({ suggestedReplies: [] })
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root.unmount())
    }
    container?.remove()
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  })

  it('loads conversations, joins their rooms, and removes socket listeners on unmount', async () => {
    const conversation = {
      reportId: 'report-1',
      reportNumber: 'R-1',
      userName: 'Ana Reyes',
      category: 'Roads',
      lastMessageAt: '2026-08-26T12:00:00.000Z',
      unreadCount: 0,
    }
    const socket = { on: vi.fn(), off: vi.fn() }
    mocks.getSocket.mockReturnValue(socket)
    mocks.mapConversations.mockReturnValue([conversation])

    await act(async () => root.render(createElement(HookHarness)))

    expect(mocks.listConversations).toHaveBeenCalledWith('access-token')
    expect(mocks.joinReportRoom).toHaveBeenCalledWith('access-token', 'report-1')
    expect(socket.on).toHaveBeenCalledTimes(4)
    expect(latestState.filteredConversations).toEqual([conversation])

    await act(async () => latestState.handleSelectConversation(conversation))

    expect(mocks.listReportMessages).toHaveBeenCalledWith('access-token', 'report-1')
    expect(mocks.markReportMessagesRead).toHaveBeenCalledWith('access-token', 'report-1')
    expect(mocks.getReportChatSuggestions).toHaveBeenCalledWith('access-token', 'report-1', false)

    await act(async () => root.unmount())
    root = null

    expect(socket.off).toHaveBeenCalledTimes(4)
  })
})
