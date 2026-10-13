/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Settings } from '../Settings'
import { APP_PAGES } from '../../../models/pageModel'

describe('Settings Page Layout & Section Synchronization', () => {
  let container
  let root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
  })

  it('renders section breadcrumb and activates corresponding tab based on activePage prop', async () => {
    await act(async () => {
      root.render(
        <Settings
          activePage={APP_PAGES.SETTINGS_SECURITY}
          profile={{ id: 'A-1', email: 'admin@citisent.gov' }}
          preferences={{ theme: 'Light', fontSize: 'Medium' }}
          onUpdatePreferences={vi.fn()}
        />
      )
    })

    // Header should contain Settings / Security breadcrumb
    expect(container.textContent).toContain('Settings')
    expect(container.textContent).toContain('Security')
    expect(container.textContent).toContain('Security Settings')
  })

  it('notifies onNavigate when switching tabs if onNavigate is provided', async () => {
    const handleNavigate = vi.fn()

    await act(async () => {
      root.render(
        <Settings
          activePage={APP_PAGES.SETTINGS_APPEARANCE}
          profile={{ id: 'A-1', email: 'admin@citisent.gov' }}
          preferences={{ theme: 'Light', fontSize: 'Medium' }}
          onUpdatePreferences={vi.fn()}
          onNavigate={handleNavigate}
        />
      )
    })

    // Find tab buttons
    const tabButtons = Array.from(container.querySelectorAll('button'))
    const notificationsTab = tabButtons.find((btn) => btn.textContent?.trim() === 'Notifications')
    expect(notificationsTab).toBeDefined()

    await act(async () => {
      notificationsTab.click()
    })

    expect(handleNavigate).toHaveBeenCalledWith(APP_PAGES.SETTINGS_NOTIFICATIONS)
  })
})
