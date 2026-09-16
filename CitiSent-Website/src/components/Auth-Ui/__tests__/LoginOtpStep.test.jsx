import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LoginOtpStep } from '../LoginOtpStep'

describe('LoginOtpStep', () => {
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
})
