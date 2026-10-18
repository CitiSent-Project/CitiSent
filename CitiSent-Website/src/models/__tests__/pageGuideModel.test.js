import { describe, expect, it } from 'vitest'
import {
  PAGE_GUIDE_CATALOG,
  getGuideForPage,
  findComponentGuide,
} from '../pageGuideModel'
import { APP_PAGES } from '../pageModel'

describe('pageGuideModel', () => {
  it('defines structured guide catalog entries for primary application pages', () => {
    expect(PAGE_GUIDE_CATALOG[APP_PAGES.DASHBOARD]).toBeDefined()
    expect(PAGE_GUIDE_CATALOG[APP_PAGES.REPORTS_BY_CATEGORY]).toBeDefined()
    expect(PAGE_GUIDE_CATALOG[APP_PAGES.USERS]).toBeDefined()
    expect(PAGE_GUIDE_CATALOG[APP_PAGES.CONVERSATIONS]).toBeDefined()
    expect(PAGE_GUIDE_CATALOG[APP_PAGES.ADMIN_MANAGEMENT]).toBeDefined()
    expect(PAGE_GUIDE_CATALOG[APP_PAGES.SETTINGS_PRIVACY_TERMS]).toBeDefined()
  })

  it('ensures each catalog step has valid id, title, targetSelector, body, and tip', () => {
    Object.entries(PAGE_GUIDE_CATALOG).forEach(([pageKey, entry]) => {
      expect(entry.pageTitle).toBeTruthy()
      expect(entry.description).toBeTruthy()
      expect(Array.isArray(entry.steps)).toBe(true)

      entry.steps.forEach((step) => {
        expect(step.id).toBeTruthy()
        expect(step.title).toBeTruthy()
        expect(step.targetSelector).toMatch(/^\[data-guide=/)
        expect(step.body).toBeTruthy()
        expect(typeof step.tip).toBe('string')
      })
    })
  })

  describe('getGuideForPage', () => {
    it('returns the exact guide entry for valid page keys', () => {
      const guide = getGuideForPage(APP_PAGES.DASHBOARD)
      expect(guide).toBeDefined()
      expect(guide.pageTitle).toBe('Dashboard Overview')
      expect(guide.steps.length).toBeGreaterThan(0)
    })

    it('falls back to parent settings guide when receiving sub-page keys', () => {
      const guide = getGuideForPage('Settings:UnknownSubSection')
      expect(guide).toBeDefined()
      expect(guide.pageTitle).toBe('Settings & Governance Hub')
    })

    it('falls back to parent reports guide when receiving sub-page keys', () => {
      const guide = getGuideForPage('Reports:CustomQueue')
      expect(guide).toBeDefined()
      expect(guide.pageTitle).toBe('Reports by Category')
    })

    it('returns null for empty or nonexistent page keys', () => {
      expect(getGuideForPage('')).toBeNull()
      expect(getGuideForPage(null)).toBeNull()
      expect(getGuideForPage('completely-unknown-route')).toBeNull()
    })
  })

  describe('findComponentGuide', () => {
    it('finds and returns component guide entry across any page in catalog', () => {
      const component = findComponentGuide('dashboard-summary-cards')
      expect(component).toBeDefined()
      expect(component.title).toBe('Summary Metric Cards')
      expect(component.targetSelector).toBe('[data-guide="dashboard-summary-cards"]')

      const privacyCard = findComponentGuide('settings-privacy-terms-card')
      expect(privacyCard).toBeDefined()
      expect(privacyCard.title).toBe('Governance & Data Inventory Hub')
    })

    it('returns null when component id is null or does not exist', () => {
      expect(findComponentGuide(null)).toBeNull()
      expect(findComponentGuide('')).toBeNull()
      expect(findComponentGuide('nonexistent-component-guide-id')).toBeNull()
    })
  })
})
