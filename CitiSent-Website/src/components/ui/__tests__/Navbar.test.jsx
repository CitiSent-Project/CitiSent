/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('/assets/CitiSentLogo.svg', () => ({ default: 'test-logo.svg' }))

import { Navbar } from '../Navbar'
import { APP_PAGES } from '../../../models/pageModel'
import { USER_ROLES } from '../../../models/roleAccessModel'

describe('Navbar branched settings navigation', () => {
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

  it('renders Settings with branched children and allows navigation to sub-sections', async () => {
    const handleNavigate = vi.fn()

    await act(async () => {
      root.render(
        <Navbar
          activePage={APP_PAGES.DASHBOARD}
          onNavigate={handleNavigate}
          profileRole={USER_ROLES.SUPERADMIN}
        >
          <div>Dashboard content</div>
        </Navbar>
      )
    })

    // Find the Settings navigation button in sidebar
    const buttons = Array.from(container.querySelectorAll('button'))
    const settingsButton = buttons.find((btn) => btn.textContent?.includes('Settings'))
    expect(settingsButton).toBeDefined()

    // Clicking Settings parent when on Dashboard should navigate to first child (Appearance)
    await act(async () => {
      settingsButton.click()
    })

    expect(handleNavigate).toHaveBeenCalledWith(APP_PAGES.SETTINGS_APPEARANCE)
  })

  it('shows child links when a settings subpage is active and navigates on child click', async () => {
    const handleNavigate = vi.fn()

    await act(async () => {
      root.render(
        <Navbar
          activePage={APP_PAGES.SETTINGS_SECURITY}
          onNavigate={handleNavigate}
          profileRole={USER_ROLES.SUPERADMIN}
        >
          <div>Settings content</div>
        </Navbar>
      )
    })

    // Submenu links should be visible
    const buttons = Array.from(container.querySelectorAll('button'))
    const securityChildButton = buttons.find((btn) => btn.textContent?.trim() === 'Security')
    expect(securityChildButton).toBeDefined()

    const notificationsChildButton = buttons.find((btn) => btn.textContent?.trim() === 'Notifications')
    expect(notificationsChildButton).toBeDefined()

    // Clicking a child link navigates to that section
    await act(async () => {
      notificationsChildButton.click()
    })

    expect(handleNavigate).toHaveBeenCalledWith(APP_PAGES.SETTINGS_NOTIFICATIONS)
  })
})
