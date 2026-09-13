// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  listReportMessages: vi.fn(),
  sendReportMessage: vi.fn(),
  markReportMessagesRead: vi.fn(),
  getReportAdminNoteSuggestions: vi.fn(),
  getReportById: vi.fn(() => Promise.resolve({ data: {} })),
}))
const socket = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
}))

vi.mock('../../../services/api/admin/reportsApiService', () => ({ reportsApiService: api }))
vi.mock('../../../services/socket/socketService', () => ({
  getSocket: () => socket,
  joinReportRoom: vi.fn(),
  leaveReportRoom: vi.fn(),
  sendSocketMessage: vi.fn(() => Promise.reject(new Error('Socket is disconnected'))),
  markSocketConversationRead: vi.fn(),
  sendSocketTyping: vi.fn(),
  sendSocketStopTyping: vi.fn(),
}))

import { ReportChatDrawer } from '../ReportChatDrawer'
import { ReportDetailPage } from '../ReportDetailPage'

const report = {
  id: '92d6fb5f-933a-4b65-b375-4d6b31fddce2',
  category: 'Bureau of Fire Protection (BFP) Processing Area',
  categoryId: 'bfp',
  status: 'Pending', date: 'July 25, 2026', name: 'John Citizen', email: 'john@example.com',
  location: 'Sto. Tomas', source: 'Website', message: 'Please help.', urgency: 'Critical', emotionLevel: 'Urgent',
}
const profile = { id: 'admin-1', role: 'Office Admin', departmentId: 'bfp' }
let root
let container
globalThis.IS_REACT_ACT_ENVIRONMENT = true

async function render(element) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => { root.render(element) })
}

afterEach(async () => {
  if (root) await act(async () => { root.unmount() })
  container?.remove()
  window.localStorage.clear()
  root = null
  container = null
  vi.clearAllMocks()
})

describe('Report chat drawer', () => {
  it('loads status-aware admin note suggestions and inserts a selected note into the textarea', async () => {
    window.localStorage.setItem('citisent.admin.accessToken', JSON.stringify('token'))
    api.listReportMessages.mockResolvedValue({ data: [] })
    api.getReportAdminNoteSuggestions.mockResolvedValue({
      data: {
        suggestedNotes: [
          { text: 'Initial review has been recorded.', rank: 1 },
        ],
      },
    })

    await render(<ReportDetailPage report={report} profile={profile} onBackToReports={vi.fn()} onUpdateStatus={vi.fn()} />)

    expect(api.getReportAdminNoteSuggestions).toHaveBeenCalledWith('token', report.id, 'pending', false)
    const suggestion = Array.from(container.querySelectorAll('button')).find((button) => button.textContent.includes('Initial review has been recorded.'))
    await act(async () => { suggestion.click() })

    const noteTextarea = Array.from(container.querySelectorAll('textarea')).find((textarea) => textarea.placeholder.includes('Add remarks'))
    expect(noteTextarea.value).toBe('Initial review has been recorded.')
  })

  it('opens from report detail and loads the report conversation', async () => {
    api.listReportMessages.mockResolvedValue({ data: [] })
    api.markReportMessagesRead.mockResolvedValue({ data: [] })

    await render(<ReportDetailPage report={report} profile={profile} onBackToReports={vi.fn()} onUpdateStatus={vi.fn()} />)
    const talkButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent.includes('Talk to User'))
    await act(async () => { talkButton.click() })

    expect(container.textContent).toContain('Talk to User')
    expect(api.listReportMessages).toHaveBeenCalledWith('', report.id)
    expect(container.textContent).toContain('No messages yet.')
  })

  it('sends a message and displays it in the thread', async () => {
    api.listReportMessages.mockResolvedValue({ data: [] })
    api.markReportMessagesRead.mockResolvedValue({ data: [] })
    api.sendReportMessage.mockResolvedValue({ data: { id: 'message-1', senderId: 'admin-1', senderRole: 'admin', content: 'We are looking into this.', createdAt: '2026-07-25T10:00:00.000Z' } })

    await render(<ReportChatDrawer report={report} profile={profile} token="token" onClose={vi.fn()} />)
    const textarea = container.querySelector('textarea')
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
      setValue.call(textarea, 'We are looking into this.')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => { container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })

    expect(api.sendReportMessage).toHaveBeenCalledWith('token', report.id, 'We are looking into this.')
    expect(container.textContent).toContain('We are looking into this.')
  })

  it('shows API failures without hiding the composer', async () => {
    api.listReportMessages.mockRejectedValue(new Error('Conversation is unavailable.'))

    await render(<ReportChatDrawer report={report} profile={profile} token="token" onClose={vi.fn()} />)

    expect(container.textContent).toContain('Conversation is unavailable.')
    expect(container.querySelector('textarea')).not.toBeNull()
  })

  it('updates the conversation when socket receive_message fires', async () => {
    api.listReportMessages.mockResolvedValue({ data: [] })
    api.markReportMessagesRead.mockResolvedValue({ data: [] })

    await render(<ReportChatDrawer report={report} profile={profile} token="token" onClose={vi.fn()} />)
    const receiveMessageCall = socket.on.mock.calls.find(call => call[0] === 'receive_message')
    expect(receiveMessageCall).toBeDefined()
    const handleReceiveMessage = receiveMessageCall[1]

    await act(async () => {
      handleReceiveMessage({
        reportId: report.id,
        message: {
          id: 'msg-new',
          senderId: 'citizen-1',
          sender_id: 'citizen-1',
          message: 'Realtime socket message',
          createdAt: '2026-07-25T11:00:00.000Z',
        }
      })
    })

    expect(container.textContent).toContain('Realtime socket message')
  })
})
