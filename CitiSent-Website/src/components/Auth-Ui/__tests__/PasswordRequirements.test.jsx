/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PasswordRequirements } from '../PasswordRequirements'

describe('PasswordRequirements component', () => {
  let container
  let root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root.unmount())
    }
    container?.remove()
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  })

  it('renders requirements checklist for empty password', async () => {
    await act(async () => {
      root.render(<PasswordRequirements password="" confirmPassword="" />)
    })

    expect(container.textContent).toContain('At least 12 characters (up to 128)')
    expect(container.textContent).toContain('At least one uppercase letter (A-Z)')
    expect(container.textContent).toContain('At least one lowercase letter (a-z)')
    expect(container.textContent).toContain('At least one number (0-9)')
    expect(container.textContent).toContain('At least one special symbol (!@#$%^&*)')
    expect(container.textContent).toContain('No spaces or whitespace')
    // No strength bar before typing
    expect(container.textContent).not.toContain('Password strength')
  })

  it('displays strength meter when password is typed', async () => {
    await act(async () => {
      root.render(<PasswordRequirements password="Weak" confirmPassword="" />)
    })

    expect(container.textContent).toContain('Password strength')
    expect(container.textContent).toContain('Very Weak')
  })

  it('displays warning when common word or sequential pattern is detected', async () => {
    await act(async () => {
      root.render(<PasswordRequirements password="Password123!" confirmPassword="" />)
    })

    expect(container.textContent).toContain('Avoid common passwords or dictionary words')
  })

  it('displays Strong status when all rules are met', async () => {
    const strongPass = 'K9#mP$2vL!q8'
    await act(async () => {
      root.render(<PasswordRequirements password={strongPass} confirmPassword={strongPass} />)
    })

    expect(container.textContent).toContain('Strong')
    expect(container.textContent).toContain('Passwords match')
  })
})
