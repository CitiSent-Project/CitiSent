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
  mapConversations: vi.fn(),
  mapMessages: vi.fn(),
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
    sendReportMessage: vi.fn(),
  },
}))

vi.mock('../../services/api/admin/reportsApiMappers', () => ({
  mapBackendConversationsResponse: mocks.mapConversations,
  mapBackendMessagesResponse: mocks.mapMessages,
  mapBackendMessageToUi: vi.fn(),
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

    expect(mocks.listConversations).toHaveBeenCalledWith('access-token', { includeLocked: true })
    expect(mocks.joinReportRoom).toHaveBeenCalledWith('access-token', 'report-1')
    expect(socket.on).toHaveBeenCalledTimes(4)
    expect(latestState.filteredConversations).toEqual([conversation])

    await act(async () => latestState.handleSelectConversation(conversation))

    expect(mocks.listReportMessages).toHaveBeenCalledWith('access-token', 'report-1')
    expect(mocks.markReportMessagesRead).toHaveBeenCalledWith('access-token', 'report-1')

    await act(async () => root.unmount())
    root = null

    expect(socket.off).toHaveBeenCalledTimes(4)
  })

  it('filters conversations by status and prevents sending messages when conversation is locked', async () => {
    const activeConv = {
      reportId: 'rep-active',
      userName: 'Active Citizen',
      category: 'Health',
      isLocked: false,
      status: 'In Progress',
      unreadCount: 0,
    }
    const lockedConv = {
      reportId: 'rep-locked',
      userName: 'Resolved Citizen',
      category: 'Sanitation',
      isLocked: true,
      status: 'Resolved',
      unreadCount: 0,
    }

    mocks.mapConversations.mockReturnValue([activeConv, lockedConv])

    await act(async () => root.render(createElement(HookHarness)))

    expect(latestState.filteredConversations).toHaveLength(2)

    // Filter to active only
    await act(async () => latestState.setStatusFilter('active'))
    expect(latestState.filteredConversations).toEqual([activeConv])

    // Filter to locked only
    await act(async () => latestState.setStatusFilter('locked'))
    expect(latestState.filteredConversations).toEqual([lockedConv])

    // Select locked conversation and attempt to send
    await act(async () => latestState.handleSelectConversation(lockedConv))
    let sendResult
    await act(async () => {
      sendResult = await latestState.handleSend('Should not send')
    })
    expect(sendResult).toBe(false)
  })
})
