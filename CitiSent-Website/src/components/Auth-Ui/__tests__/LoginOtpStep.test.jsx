/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LoginOtpStep } from '../LoginOtpStep'

describe('LoginOtpStep', () => {
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

  it('renders all 6 numeric input slots and masked email in 2FA notice', () => {
    const markup = renderToStaticMarkup(
      <LoginOtpStep
        maskedEmail="s**********n@citisent.gov.ph"
        email="superadmin@citisent.gov.ph"
        onVerify={vi.fn()}
        onResend={vi.fn()}
        onReturnToLogin={vi.fn()}
        initialCooldown={60}
      />
    )

    expect(markup).toContain('Two-Factor Authentication')
    expect(markup).toContain('s**********n@citisent.gov.ph')
    expect(markup).toContain('otp-digit-0')
    expect(markup).toContain('otp-digit-1')
    expect(markup).toContain('otp-digit-2')
    expect(markup).toContain('otp-digit-3')
    expect(markup).toContain('otp-digit-4')
    expect(markup).toContain('otp-digit-5')
    expect(markup).toContain('Resend code in 60s')
    expect(markup).toContain('Back to Login')
    expect(markup).toContain('Verify &amp; Sign In')
  })

  it('allows continuously pressing Backspace to delete numbers backwards without clicking boxes', async () => {
    await act(async () => {
      root.render(
        <LoginOtpStep
          maskedEmail="d*******6@gmail.com"
          email="darren@gmail.com"
          onVerify={vi.fn()}
          onResend={vi.fn()}
          onReturnToLogin={vi.fn()}
          initialCooldown={60}
        />
      )
    })

    const inputs = Array.from(container.querySelectorAll('input[id^="otp-digit-"]'))
    expect(inputs).toHaveLength(6)

    // Type 3 digits: '5', '5', '5'
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(inputs[0], '5')
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(inputs[1], '5')
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(inputs[2], '5')
      inputs[2].dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(inputs[0].value).toBe('5')
    expect(inputs[1].value).toBe('5')
    expect(inputs[2].value).toBe('5')
    expect(inputs[3].value).toBe('')

    // Focus is now on input[3] (which is empty). Press Backspace!
    await act(async () => {
      inputs[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    })

    // It should have cleared input[2] and focused input[2]
    expect(inputs[2].value).toBe('')
    expect(document.activeElement).toBe(inputs[2])

    // Press Backspace again while on input[2] (now empty)
    await act(async () => {
      inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    })

    // It should have cleared input[1] and focused input[1]
    expect(inputs[1].value).toBe('')
    expect(document.activeElement).toBe(inputs[1])

    // Press Backspace again while on input[1] (now empty)
    await act(async () => {
      inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    })

    // It should have cleared input[0] and focused input[0]
    expect(inputs[0].value).toBe('')
    expect(document.activeElement).toBe(inputs[0])
  })

  it('uses responsive grid and shrinkable input classes to prevent mobile horizontal overflow', () => {
    const markup = renderToStaticMarkup(
      <LoginOtpStep
        maskedEmail="superadmin.very.long.email.address@citisent.gov.ph"
        email="superadmin.very.long.email.address@citisent.gov.ph"
        onVerify={vi.fn()}
        onResend={vi.fn()}
        onReturnToLogin={vi.fn()}
        initialCooldown={60}
      />
    )

    // Ensure responsive grid container is used instead of fixed non-shrinking flex width
    expect(markup).toContain('grid grid-cols-6')
    expect(markup).toContain('w-full')

    // Ensure inputs include fluid and shrinkable classes
    expect(markup).toContain('min-w-0')

    // Ensure long email handles wrapping on small mobile screens
    expect(markup).toContain('break-all')
  })

  it('populates all 6 slots and calls onVerify when 6 digits are pasted or autofilled', async () => {
    const verifySpy = vi.fn().mockResolvedValue({ ok: true })

    await act(async () => {
      root.render(
        <LoginOtpStep
          maskedEmail="d*******6@gmail.com"
          email="darren@gmail.com"
          onVerify={verifySpy}
          onResend={vi.fn()}
          onReturnToLogin={vi.fn()}
          initialCooldown={60}
        />
      )
    })

    const inputs = Array.from(container.querySelectorAll('input[id^="otp-digit-"]'))
    expect(inputs).toHaveLength(6)

    // Simulate pasting "123456" into slot 0
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(inputs[0], '123456')
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(inputs.map((input) => input.value).join('')).toBe('123456')
    expect(verifySpy).toHaveBeenCalledWith('123456')
  })
})


