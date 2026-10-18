/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SetupPasswordPage } from '../SetupPassword'
import { authApiService } from '../../../services/api/auth/authApiService'

vi.mock('../../../services/api/auth/authApiService', () => ({
  authApiService: {
    activateAccount: vi.fn(),
    resetPassword: vi.fn(),
  },
}))

function setInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set
  nativeInputValueSetter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('SetupPasswordPage', () => {
  let container
  let root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.clearAllMocks()

    // Mock window.location
    delete window.location
    window.location = new URL('http://localhost:5173/setup-password?token=valid-token-123')
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root.unmount())
    }
    container?.remove()
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  })

  it('renders password setup form and requirement checklist', async () => {
    await act(async () => {
      root.render(<SetupPasswordPage />)
    })

    expect(container.textContent).toContain('Set up your password')
    expect(container.textContent).toContain('Choose a password for your CitiSent account.')
    expect(container.textContent).toContain('At least 12 characters (up to 128)')
    expect(container.textContent).toContain('At least one uppercase letter (A-Z)')
    expect(container.textContent).toContain('At least one lowercase letter (a-z)')
    expect(container.textContent).toContain('At least one number (0-9)')
    expect(container.textContent).toContain('At least one special symbol (!@#$%^&*)')
  })

  it('shows error when submitting password less than 12 characters', async () => {
    await act(async () => {
      root.render(<SetupPasswordPage />)
    })

    const passwordInput = container.querySelector('#setup-password')
    const confirmInput = container.querySelector('#setup-confirm-password')
    const form = container.querySelector('form')

    await act(async () => {
      setInputValue(passwordInput, 'Str0ng!Pass')
      setInputValue(confirmInput, 'Str0ng!Pass')
    })

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('Password must be at least 12 characters long.')
    expect(authApiService.activateAccount).not.toHaveBeenCalled()
  })

  it('shows error when submitting password containing common words or sequences', async () => {
    await act(async () => {
      root.render(<SetupPasswordPage />)
    })

    const passwordInput = container.querySelector('#setup-password')
    const confirmInput = container.querySelector('#setup-confirm-password')
    const form = container.querySelector('form')

    await act(async () => {
      setInputValue(passwordInput, 'Password123!@#')
      setInputValue(confirmInput, 'Password123!@#')
    })

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('Avoid common passwords or dictionary words')
    expect(authApiService.activateAccount).not.toHaveBeenCalled()
  })

  it('calls activateAccount when valid strong password is submitted', async () => {
    authApiService.activateAccount.mockResolvedValueOnce({
      data: { message: 'Your CitiSent account is active. You can now sign in.' },
    })

    await act(async () => {
      root.render(<SetupPasswordPage />)
    })

    const passwordInput = container.querySelector('#setup-password')
    const confirmInput = container.querySelector('#setup-confirm-password')
    const form = container.querySelector('form')

    const validPass = 'K9#mP$2vL!q8'

    await act(async () => {
      setInputValue(passwordInput, validPass)
      setInputValue(confirmInput, validPass)
    })

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(authApiService.activateAccount).toHaveBeenCalledWith({
      token: 'valid-token-123',
      password: validPass,
    })
  })
})
