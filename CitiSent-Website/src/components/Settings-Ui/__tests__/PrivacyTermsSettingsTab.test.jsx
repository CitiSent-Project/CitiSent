/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrivacyTermsSettingsTab } from '../PrivacyTermsSettingsTab'

function changeInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set
  nativeInputValueSetter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('PrivacyTermsSettingsTab', () => {
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

  it('renders official compliance header and all 5 Supabase data inventory cards', async () => {
    await act(async () => {
      root.render(<PrivacyTermsSettingsTab />)
    })

    // Header badges
    expect(container.textContent).toContain('Data Privacy Policy & Administrative Terms')
    expect(container.textContent).toContain('RA 10173 Compliant')
    expect(container.textContent).toContain('Version 2.4 (Oct 2026)')
    expect(container.textContent).toContain('AES-256 & RLS Encrypted')

    // 5 Supabase data inventory cards
    expect(container.textContent).toContain('Profiles & Identity')
    expect(container.textContent).toContain('Table: profiles')
    expect(container.textContent).toContain('Incident Reports & Geolocation')
    expect(container.textContent).toContain('Table: reports')
    expect(container.textContent).toContain('Evidence Attachments')
    expect(container.textContent).toContain('Table: attachments (storage)')
    expect(container.textContent).toContain('Citizen-Staff Messaging')
    expect(container.textContent).toContain('Table: report_messages')
    expect(container.textContent).toContain('AI Sentiment & Urgency Metrics')
  })

  it('toggles seamlessly between Data Privacy Policy and Admin Terms of Use', async () => {
    await act(async () => {
      root.render(<PrivacyTermsSettingsTab />)
    })

    // Initially in Data Privacy Policy mode
    expect(container.textContent).toContain('1. Legal Basis & Philippine Data Privacy Act Compliance')
    expect(container.textContent).toContain('Official Data Protection Officer (DPO) Channel')

    // Click Admin Terms of Use toggle
    const buttons = Array.from(container.querySelectorAll('button'))
    const termsButton = buttons.find((btn) => btn.textContent?.includes('Admin Terms of Use'))
    expect(termsButton).toBeDefined()

    await act(async () => {
      termsButton.click()
    })

    // Now in Admin Terms mode
    expect(container.textContent).toContain('1. Administrative Authority & Scope of Use')
    expect(container.textContent).toContain('2. Strict Duty of Confidentiality & Non-Disclosure')
    expect(container.textContent).toContain('Data Stewardship & Ethics Affirmation')

    // Supabase data inventory cards are hidden in Terms mode
    expect(container.textContent).not.toContain('Supabase Architecture & Data Inventory')
  })

  it('filters policy clauses dynamically when typing into search filter', async () => {
    await act(async () => {
      root.render(<PrivacyTermsSettingsTab />)
    })

    const searchInput = container.querySelector('input[type="text"]')
    expect(searchInput).toBeDefined()

    // Search for "erasure"
    await act(async () => {
      changeInputValue(searchInput, 'erasure')
    })

    // Section 6 (Retention & Right to be Forgotten) should be present
    expect(container.textContent).toContain('Right to be Forgotten')

    // Unrelated sections should not match
    expect(container.textContent).not.toContain('1. Legal Basis & Philippine Data Privacy Act Compliance')

    // Search for a non-existent phrase
    await act(async () => {
      changeInputValue(searchInput, 'xyz123nonexistent')
    })

    expect(container.textContent).toContain('No matching clauses found')

    // Clear search
    const clearButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Clear search filter')
    )
    expect(clearButton).toBeDefined()

    await act(async () => {
      clearButton.click()
    })

    expect(container.textContent).toContain('1. Legal Basis & Philippine Data Privacy Act Compliance')
  })

  it('triggers window.print when Print / Save PDF button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    await act(async () => {
      root.render(<PrivacyTermsSettingsTab />)
    })

    const printButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Print / Save PDF')
    )
    expect(printButton).toBeDefined()

    await act(async () => {
      printButton.click()
    })

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })
})
