/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConversationListItem } from '../ConversationListItem'

describe('ConversationListItem', () => {
  let container
  let root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root.unmount())
    }
    container?.remove()
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  })

  it('renders report ID as the main title instead of user email', async () => {
    const conversation = {
      reportId: 'rep-uuid-1234',
      reportNumber: 'cvc-0012',
      userName: 'janedoe@gmail.com',
      lastMessage: 'Hello admin',
      lastMessageAt: '2026-09-05T10:00:00.000Z',
      category: 'Civic Issues',
      unreadCount: 0,
    }

    await act(async () => {
      root.render(<ConversationListItem conversation={conversation} isActive={false} onClick={() => {}} />)
    })

    // Report ID should be the title
    expect(container.textContent).toContain('Report #cvc-0012')
    // Mobile user email is displayed
    expect(container.textContent).toContain('janedoe@gmail.com')
    // Category should be rendered
    expect(container.textContent).toContain('Civic Issues')
    // Message preview
    expect(container.textContent).toContain('Hello admin')
  })

  it('handles fallback when reportNumber is absent using reportId', async () => {
    const conversation = {
      reportId: '98765432-abcd-ef01-2345',
      userName: 'citizen@example.com',
      lastMessage: 'Road damage here',
      category: 'Infrastructure',
    }

    await act(async () => {
      root.render(<ConversationListItem conversation={conversation} isActive={false} onClick={() => {}} />)
    })

    expect(container.textContent).toContain('Report #98765432…')
    expect(container.textContent).toContain('citizen@example.com')
  })

  it('displays unread indicators and active states correctly', async () => {
    const handleClick = vi.fn()
    const conversation = {
      reportId: 'rep-1',
      reportNumber: 'CVC-0099',
      userName: 'john@example.com',
      lastMessage: 'Urgent assistance needed',
      unreadCount: 3,
    }

    await act(async () => {
      root.render(<ConversationListItem conversation={conversation} isActive onClick={handleClick} />)
    })

    const button = container.querySelector('button')
    expect(button).toBeTruthy()
    expect(button.getAttribute('aria-current')).toBe('true')
    expect(button.getAttribute('aria-label')).toContain('Report #CVC-0099 from john@example.com — 3 unread messages')
    expect(container.textContent).toContain('3')

    // Click trigger
    await act(async () => {
      button.click()
    })
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
