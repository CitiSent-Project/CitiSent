// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  listReportMessages: vi.fn(),
  sendReportMessage: vi.fn(),
  markReportMessagesRead: vi.fn(),
}))
const realtime = vi.hoisted(() => ({ subscribe: vi.fn(() => () => {}) }))

vi.mock('../../../services/api/admin/reportsApiService', () => ({ reportsApiService: api }))
vi.mock('../../../services/realtime/reportMessagesRealtime', () => ({ subscribeToReportMessages: realtime.subscribe }))

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
  root = null
  container = null
  vi.clearAllMocks()
})

describe('Report chat drawer', () => {
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

  it('reloads the conversation when Supabase Realtime reports a change', async () => {
    api.listReportMessages.mockResolvedValue({ data: [] })
    api.markReportMessagesRead.mockResolvedValue({ data: [] })

    await render(<ReportChatDrawer report={report} profile={profile} token="token" onClose={vi.fn()} />)
    const subscription = realtime.subscribe.mock.calls[0][0]
    await act(async () => { await subscription.onChange() })

    expect(realtime.subscribe).toHaveBeenCalledWith(expect.objectContaining({ reportId: report.id }))
    expect(api.listReportMessages).toHaveBeenCalledTimes(2)
  })
})
