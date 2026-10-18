/* @vitest-environment jsdom */
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuideProvider, usePageGuide } from '../usePageGuide'
import { APP_PAGES } from '../../models/pageModel'

describe('usePageGuide', () => {
  let container
  let root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    container?.remove()
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    vi.clearAllMocks()
    localStorage.clear()
  })

  function setupHook(activePage = APP_PAGES.DASHBOARD) {
    let latest = null
    function Harness() {
      const guide = usePageGuide()
      useEffect(() => {
        latest = guide
      }, [guide])
      return null
    }

    root = createRoot(container)
    act(() => {
      root.render(
        <GuideProvider activePage={activePage}>
          <Harness />
        </GuideProvider>
      )
    })

    return {
      getLatest: () => latest,
    }
  }

  it('provides safe defaults when hook is called outside provider', () => {
    let latestOutside = null
    function BareHarness() {
      latestOutside = usePageGuide()
      return null
    }

    root = createRoot(container)
    act(() => {
      root.render(<BareHarness />)
    })

    expect(latestOutside.isTourActive).toBe(false)
    expect(latestOutside.activeGuideItem).toBeNull()
    expect(latestOutside.currentStepIndex).toBe(0)
    expect(latestOutside.hasCompletedTour('any')).toBe(false)
  })

  it('initializes with inactive tour and loads active page steps', () => {
    const { getLatest } = setupHook(APP_PAGES.DASHBOARD)

    expect(getLatest().isTourActive).toBe(false)
    expect(getLatest().activeGuideItem).toBeNull()
    expect(getLatest().totalSteps).toBeGreaterThan(0)
    expect(getLatest().activePageSteps[0].id).toBe('dashboard-summary-cards')
  })

  it('starts tour, advances steps with nextStep, steps back with prevStep, and ends tour', () => {
    const { getLatest } = setupHook(APP_PAGES.DASHBOARD)

    // Start tour
    act(() => {
      getLatest().startTour()
    })

    expect(getLatest().isTourActive).toBe(true)
    expect(getLatest().currentStepIndex).toBe(0)
    expect(getLatest().activeGuideItem.id).toBe('dashboard-summary-cards')

    // Next step
    act(() => {
      getLatest().nextStep()
    })
    expect(getLatest().currentStepIndex).toBe(1)
    expect(getLatest().activeGuideItem.id).toBe('dashboard-sentiment')

    // Previous step
    act(() => {
      getLatest().prevStep()
    })
    expect(getLatest().currentStepIndex).toBe(0)
    expect(getLatest().activeGuideItem.id).toBe('dashboard-summary-cards')

    // End tour
    act(() => {
      getLatest().endTour()
    })
    expect(getLatest().isTourActive).toBe(false)
    expect(getLatest().activeGuideItem).toBeNull()
    expect(getLatest().hasCompletedTour(APP_PAGES.DASHBOARD)).toBe(true)
  })

  it('opens component guide popover for a standalone component', () => {
    const { getLatest } = setupHook(APP_PAGES.DASHBOARD)

    act(() => {
      getLatest().openComponentGuide('dashboard-department-distribution')
    })

    expect(getLatest().isTourActive).toBe(false)
    expect(getLatest().activeGuideItem).toBeDefined()
    expect(getLatest().activeGuideItem.id).toBe('dashboard-department-distribution')

    // Dismiss guide
    act(() => {
      getLatest().closeGuide()
    })
    expect(getLatest().activeGuideItem).toBeNull()
  })

  it('closes active guide when Escape key is pressed', () => {
    const { getLatest } = setupHook(APP_PAGES.DASHBOARD)

    act(() => {
      getLatest().startTour()
    })
    expect(getLatest().isTourActive).toBe(true)

    // Simulate Escape key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(getLatest().isTourActive).toBe(false)
    expect(getLatest().activeGuideItem).toBeNull()
  })
})
