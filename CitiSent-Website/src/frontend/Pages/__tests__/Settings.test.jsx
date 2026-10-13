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

  it('does not render horizontal tab navigation chips and notifies onNavigate via internal actions', async () => {
    const handleNavigate = vi.fn()

    await act(async () => {
      root.render(
        <Settings
          activePage={APP_PAGES.SETTINGS_SYSTEM}
          profile={{ id: 'A-1', email: 'admin@citisent.gov' }}
          preferences={{ theme: 'Light', fontSize: 'Medium' }}
          activityLog={[{ id: 1, action: 'Login' }]}
          onUpdatePreferences={vi.fn()}
          onNavigate={handleNavigate}
        />
      )
    })

    // Horizontal tabs should no longer be rendered
    const tabNavButtons = Array.from(container.querySelectorAll('button')).filter((btn) =>
      ['Appearance', 'Security', 'Notifications', 'Report Management'].includes(btn.textContent?.trim())
    )
    expect(tabNavButtons).toHaveLength(0)

    // Clicking "Open activity logs" inside System section calls onNavigate with SETTINGS_AUDIT_LOGS
    const openLogsButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Open activity logs')
    )
    expect(openLogsButton).toBeDefined()

    await act(async () => {
      openLogsButton.click()
    })

    expect(handleNavigate).toHaveBeenCalledWith(APP_PAGES.SETTINGS_AUDIT_LOGS)
  })
})
