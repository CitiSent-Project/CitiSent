/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentGuideTrigger } from '../ComponentGuideTrigger'
import { PageGuideNavbarButton } from '../PageGuideNavbarButton'
import { GuideProvider } from '../../../hooks/usePageGuide'
import { APP_PAGES } from '../../../models/pageModel'

describe('ComponentGuideTrigger & PageGuideNavbarButton', () => {
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

  describe('ComponentGuideTrigger', () => {
    it('returns null if guideId is not provided', () => {
      act(() => {
        root.render(
          <GuideProvider activePage={APP_PAGES.DASHBOARD}>
            <ComponentGuideTrigger guideId={null} />
          </GuideProvider>
        )
      })
      expect(container.innerHTML).toBe('')
    })

    it('renders trigger button and opens component guide on click', () => {
      act(() => {
        root.render(
          <GuideProvider activePage={APP_PAGES.DASHBOARD}>
            <ComponentGuideTrigger guideId="dashboard-summary-cards" />
          </GuideProvider>
        )
      })

      const btn = container.querySelector('button')
      expect(btn).toBeDefined()
      expect(btn.textContent).toContain('?')

      act(() => {
        btn.click()
      })
    })
  })

  describe('PageGuideNavbarButton', () => {
    it('renders navbar button and toggles guide dropdown menu', () => {
      act(() => {
        root.render(
          <GuideProvider activePage={APP_PAGES.DASHBOARD}>
            <PageGuideNavbarButton activePage={APP_PAGES.DASHBOARD} />
          </GuideProvider>
        )
      })

      const toggleBtn = container.querySelector('button')
      expect(toggleBtn).toBeDefined()
      expect(toggleBtn.getAttribute('aria-label')).toBe('Open page guide and mini-manual')

      // Open menu
      act(() => {
        toggleBtn.click()
      })

      expect(container.textContent).toContain('Dashboard Overview')
      expect(container.textContent).toContain('Step-by-Step Walkthrough')
      expect(container.textContent).toContain('Start Tour')
      expect(container.textContent).toContain('Summary Metric Cards')

      // Click Start Tour
      const startTourBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent.includes('Start Tour')
      )
      expect(startTourBtn).toBeDefined()

      act(() => {
        startTourBtn.click()
      })

      // Dropdown closes upon tour start
      expect(container.querySelector('Start Tour')).toBeNull()
    })
  })
})
