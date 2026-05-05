import { describe, expect, it, vi } from 'vitest'
import { getFriendlyErrorGuidance, notifyError } from '../toastHelpers'

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}))

describe('toastHelpers', () => {
  it('rewrites validation noise into user-friendly guidance', () => {
    expect(
      getFriendlyErrorGuidance('Request validation failed (phoneNumber) - body.phoneNumber: Invalid')
    ).toBe('Please check the phone number and try again.')
  })

  it('keeps plain error guidance unchanged when it is already user-friendly', () => {
    expect(getFriendlyErrorGuidance('Invalid credentials')).toBe('Invalid credentials')
  })

  it('sanitizes toast guidance before rendering the message', async () => {
    const { toast } = await import('react-hot-toast')

    notifyError('Profile update failed.', 'Request validation failed (phoneNumber) - body.phoneNumber: Invalid')

    expect(toast.error).toHaveBeenCalledWith(
      'Profile update failed.\nWhat to do: Please check the phone number and try again.'
    )
  })
})