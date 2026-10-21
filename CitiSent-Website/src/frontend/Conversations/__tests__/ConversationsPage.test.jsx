/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConversationsPage } from '../ConversationsPage'
import * as useConversationsStateModule from '../../../hooks/useConversationsState'

vi.mock('../../../components/Guide-Ui/ComponentGuideTrigger', () => ({
  ComponentGuideTrigger: () => <button type="button" aria-label="Guide Trigger">?</button>,
}))

vi.mock('../../../components/Reports-Ui/ReportChatThread', () => ({
  ReportChatThread: ({ messages }) => (
    <div data-testid="chat-thread">
      {messages.map((m) => (
        <p key={m.id}>{m.content}</p>
      ))}
    </div>
  ),
}))

vi.mock('../../../components/Reports-Ui/ReportChatComposer', () => ({
  ReportChatComposer: ({ onSend, disabled }) => (
    <form
      data-testid="chat-composer"
      onSubmit={(e) => {
        e.preventDefault()
        onSend('Hello from composer')
      }}
    >
      <input aria-label="Message" disabled={disabled} />
      <button type="submit" disabled={disabled}>Send</button>
    </form>
  ),
}))

describe('ConversationsPage Responsive Layout & Controls', () => {
  let container
  let root
  let mockHookReturn

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    mockHookReturn = {
      activeConversation: null,
      chatError: '',
      chatLoading: false,
      conversationsError: '',
      conversationsLoading: false,
      filteredConversations: [
        {
          reportId: 'rep-1',
          reportNumber: 'cvc-0001',
          userName: 'citizen1@test.com',
          lastMessage: 'Broken streetlight',
          lastMessageAt: '2026-10-21T10:00:00.000Z',
          unreadCount: 2,
          isLocked: false,
        },
        {
          reportId: 'rep-2',
          reportNumber: 'cvc-0002',
          userName: 'citizen2@test.com',
          lastMessage: 'Pothole fixed',
          lastMessageAt: '2026-10-21T09:00:00.000Z',
          unreadCount: 0,
          isLocked: true,
          status: 'Resolved',
        },
      ],
      handleComposerTyping: vi.fn(),
      handleSelectConversation: vi.fn(),
      handleSend: vi.fn(),
      isUserTyping: false,
      loadConversations: vi.fn(),
      loadMessages: vi.fn(),
      messages: [],
      mobileShowChat: false,
      searchQuery: '',
      sending: false,
      setMobileShowChat: vi.fn(),
      setSearchQuery: vi.fn(),
      statusFilter: 'all',
      setStatusFilter: vi.fn(),
    }

    vi.spyOn(useConversationsStateModule, 'useConversationsState').mockImplementation(() => mockHookReturn)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root.unmount())
    }
    container?.remove()
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
    vi.restoreAllMocks()
  })

  it('renders the 3-tier responsive header with title, unread filter, and segmented tabs', async () => {
    await act(async () => {
      root.render(<ConversationsPage profile={{ id: 'admin-1' }} />)
    })

    // Row 1: Conversations heading + Unread button
    const heading = container.querySelector('h1')
    expect(heading).not.toBeNull()
    expect(heading.textContent).toBe('Conversations')

    const unreadButton = container.querySelector('button[title="Filter unread conversations"]')
    expect(unreadButton).not.toBeNull()
    expect(unreadButton.textContent).toContain('Unread')

    // Row 2: Status filter tabs (All, Active, Locked)
    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist).not.toBeNull()

    const tabs = tablist.querySelectorAll('[role="tab"]')
    expect(tabs.length).toBe(3)
    expect(tabs[0].textContent.trim()).toBe('All')
    expect(tabs[1].textContent.trim()).toBe('Active')
    expect(tabs[2].textContent.trim()).toBe('Locked')

    // Row 3: Search input
    const searchInput = container.querySelector('#conversations-search')
    expect(searchInput).not.toBeNull()
    expect(searchInput.getAttribute('placeholder')).toBe('Search conversations...')
  })

  it('allows clicking status filter tabs to invoke setStatusFilter', async () => {
    await act(async () => {
      root.render(<ConversationsPage profile={{ id: 'admin-1' }} />)
    })

    const tabs = container.querySelectorAll('[role="tab"]')

    await act(async () => {
      tabs[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(mockHookReturn.setStatusFilter).toHaveBeenCalledWith('active')

    await act(async () => {
      tabs[2].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(mockHookReturn.setStatusFilter).toHaveBeenCalledWith('locked')
  })

  it('filters conversation list when Unread toggle is clicked', async () => {
    await act(async () => {
      root.render(<ConversationsPage profile={{ id: 'admin-1' }} />)
    })

    const unreadButton = container.querySelector('button[title="Filter unread conversations"]')
    expect(unreadButton.getAttribute('aria-pressed')).toBe('false')

    // Initially shows both conversations
    expect(container.textContent).toContain('Report #cvc-0001')
    expect(container.textContent).toContain('Report #cvc-0002')

    // Click Unread toggle
    await act(async () => {
      unreadButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(unreadButton.getAttribute('aria-pressed')).toBe('true')
    // Now only rep-1 (unreadCount: 2) is displayed
    expect(container.textContent).toContain('Report #cvc-0001')
    expect(container.textContent).not.toContain('Report #cvc-0002')
  })

  it('renders active conversation with responsive back button and locked read-only state', async () => {
    mockHookReturn.activeConversation = {
      reportId: 'rep-2',
      reportNumber: 'cvc-0002',
      userName: 'citizen2@test.com',
      lastMessage: 'Pothole fixed',
      isLocked: true,
      status: 'Resolved',
    }
    mockHookReturn.mobileShowChat = true

    await act(async () => {
      root.render(<ConversationsPage profile={{ id: 'admin-1' }} />)
    })

    // Mobile back button exists and calls setMobileShowChat(false)
    const backBtn = container.querySelector('button[aria-label="Back to conversations list"]')
    expect(backBtn).not.toBeNull()

    await act(async () => {
      backBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(mockHookReturn.setMobileShowChat).toHaveBeenCalledWith(false)

    // Locked badge is shown with correct styling
    expect(container.textContent).toContain('Resolved')
    expect(container.textContent).toContain('Report is Resolved · Chat History is Read-Only')

    // Composer should NOT be rendered when locked
    expect(container.querySelector('[data-testid="chat-composer"]')).toBeNull()
  })

  it('renders chat composer when active conversation is active (not locked)', async () => {
    mockHookReturn.activeConversation = {
      reportId: 'rep-1',
      reportNumber: 'cvc-0001',
      userName: 'citizen1@test.com',
      isLocked: false,
    }
    mockHookReturn.mobileShowChat = true

    await act(async () => {
      root.render(<ConversationsPage profile={{ id: 'admin-1' }} />)
    })

    // Chat composer is visible
    expect(container.querySelector('[data-testid="chat-composer"]')).not.toBeNull()
    expect(container.textContent).not.toContain('Chat History is Read-Only')
  })
})
