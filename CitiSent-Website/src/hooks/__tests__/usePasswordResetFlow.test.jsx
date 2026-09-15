/* @vitest-environment jsdom */
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePasswordResetFlow } from '../auth/usePasswordResetFlow'
import { authApiService } from '../../services/api/auth/authApiService'
import { PASSWORD_RESET_STEPS } from '../../models/passwordResetModel'

vi.mock('../../services/api/auth/authApiService', () => ({
  authApiService: {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
    resetPasswordWithOtp: vi.fn(),
  },
}))

describe('usePasswordResetFlow', () => {
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
    vi.useRealTimers()
  })

  function setupHook() {
    let latest = null
    function Harness() {
      const flow = usePasswordResetFlow()
      useEffect(() => {
        latest = flow
      }, [flow])
      return null
    }

    root = createRoot(container)
    act(() => {
      root.render(<Harness />)
    })

    return {
      getLatest: () => latest,
    }
  }

  it('initializes with default state on the email step', () => {
    const { getLatest } = setupHook()
    expect(getLatest().step).toBe(PASSWORD_RESET_STEPS.EMAIL)
    expect(getLatest().email).toBe('')
    expect(getLatest().otp).toBe('')
    expect(getLatest().isSubmitting).toBe(false)
    expect(getLatest().errorMessage).toBe('')
  })

  it('rejects invalid email submission without calling authApiService', async () => {
    const { getLatest } = setupHook()

    let result
    await act(async () => {
      result = await getLatest().sendOtp('invalid-email')
    })

    expect(result).toBe(false)
    expect(authApiService.requestOtp).not.toHaveBeenCalled()
    expect(getLatest().errorMessage).toBe('Please enter a valid email address.')
  })

  it('handles successful OTP send and transition to check-email step', async () => {
    authApiService.requestOtp.mockResolvedValueOnce({ data: { success: true } })
    const { getLatest } = setupHook()

    let result
    await act(async () => {
      result = await getLatest().sendOtp('user@citisent.gov')
    })

    expect(result).toBe(true)
    expect(authApiService.requestOtp).toHaveBeenCalledWith({ email: 'user@citisent.gov' })
    expect(getLatest().step).toBe(PASSWORD_RESET_STEPS.CHECK_EMAIL)
    expect(getLatest().email).toBe('user@citisent.gov')
    expect(getLatest().errorMessage).toContain('If an account matches this email')

    act(() => {
      getLatest().proceedToOtp()
    })
    expect(getLatest().step).toBe(PASSWORD_RESET_STEPS.OTP)
  })

  it('handles verify OTP and transitions to password reset step', async () => {
    authApiService.verifyOtp.mockResolvedValueOnce({
      data: { resetToken: 'valid-reset-token-123' },
    })
    const { getLatest } = setupHook()

    act(() => {
      getLatest().updateEmail('user@citisent.gov')
      getLatest().updateOtp('123456')
    })

    await act(async () => {
      await getLatest().verifyOtp()
    })

    expect(authApiService.verifyOtp).toHaveBeenCalledWith({
      email: 'user@citisent.gov',
      otp: '123456',
    })
    expect(getLatest().step).toBe(PASSWORD_RESET_STEPS.PASSWORD)
    expect(getLatest().resetToken).toBe('valid-reset-token-123')
  })

  it('completes password reset and moves to success step', async () => {
    authApiService.verifyOtp.mockResolvedValueOnce({
      data: { resetToken: 'token-abc' },
    })
    authApiService.resetPasswordWithOtp.mockResolvedValueOnce({ data: { success: true } })

    const { getLatest } = setupHook()

    act(() => {
      getLatest().updateEmail('user@citisent.gov')
      getLatest().updateOtp('123456')
    })

    await act(async () => {
      await getLatest().verifyOtp()
    })

    let resetResult
    await act(async () => {
      resetResult = await getLatest().resetPassword('newPassword123', 'newPassword123')
    })

    expect(resetResult).toBe(true)
    expect(authApiService.resetPasswordWithOtp).toHaveBeenCalledWith({
      resetToken: 'token-abc',
      password: 'newPassword123',
    })
    expect(getLatest().step).toBe(PASSWORD_RESET_STEPS.SUCCESS)
  })
})
