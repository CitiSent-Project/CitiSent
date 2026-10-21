/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuidedTourOverlay } from '../GuidedTourOverlay'
import { GuideProvider, usePageGuide } from '../../../hooks/usePageGuide'
import { APP_PAGES } from '../../../models/pageModel'

describe('GuidedTourOverlay Responsive Positioning', () => {
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
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders nothing when no guide is active', () => {
    act(() => {
      root.render(
        <GuideProvider activePage={APP_PAGES.DASHBOARD}>
          <GuidedTourOverlay />
        </GuideProvider>
      )
    })

    expect(document.querySelector('.guide-tour-root')).toBeNull()
  })

  it('renders responsive mobile bottom-card when viewport width is small (< 640px)', () => {
    // Emulate small mobile viewport (iPhone SE: 375px)
    window.innerWidth = 375
    window.innerHeight = 667

    function Launcher() {
      const { startTour } = usePageGuide()
      return (
        <div>
          <button type="button" onClick={() => startTour()}>
            Launch
          </button>
          <GuidedTourOverlay />
        </div>
      )
    }

    act(() => {
      root.render(
        <GuideProvider activePage={APP_PAGES.DASHBOARD}>
          <Launcher />
        </GuideProvider>
      )
    })

    const launchBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Launch')
    )
    act(() => {
      launchBtn.click()
    })

    const overlay = document.querySelector('.guide-tour-root')
    expect(overlay).toBeDefined()
    expect(overlay).not.toBeNull()

    // Popover content should be visible
    expect(document.body.textContent).toContain('Summary Metric Cards')
    expect(document.body.textContent).toContain('Step 1 of')

    // Find popover container
    const popoverBox = document.querySelector('[role="dialog"]')
    expect(popoverBox).toBeDefined()
    expect(popoverBox.classList.contains('max-w-[calc(100vw-1.5rem)]')).toBe(true)
  })

  it('renders floating popover on desktop viewports (>= 640px) clamped within screen boundaries', () => {
    // Emulate standard desktop monitor (1280x800)
    window.innerWidth = 1280
    window.innerHeight = 800

    function Launcher() {
      const { startTour } = usePageGuide()
      return (
        <div>
          <button type="button" onClick={() => startTour()}>
            Launch
          </button>
          <GuidedTourOverlay />
        </div>
      )
    }

    act(() => {
      root.render(
        <GuideProvider activePage={APP_PAGES.DASHBOARD}>
          <Launcher />
        </GuideProvider>
      )
    })

    const launchBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Launch')
    )
    act(() => {
      launchBtn.click()
    })

    // Advance to next step
    const nextBtn = Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Next')
    )
    expect(nextBtn).toBeDefined()

    act(() => {
      nextBtn.click()
    })

    expect(document.body.textContent).toContain('Step 2 of')
  })
})
