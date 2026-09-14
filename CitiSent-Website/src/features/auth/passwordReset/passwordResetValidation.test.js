import { describe, expect, it } from 'vitest'
import { normalizeEmail, normalizeOtp, validateEmail, validateOtp, validatePassword } from './passwordResetValidation'

describe('password reset validation', () => {
  it('normalizes valid email addresses and rejects invalid ones', () => {
    expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com')
    expect(validateEmail('invalid')).toBeTruthy()
    expect(validateEmail(' user@example.com ')).toBe('')
  })
  it('accepts exactly six numeric OTP characters', () => {
    expect(normalizeOtp('12a34567')).toBe('123456')
    expect(validateOtp('123456')).toBe('')
    expect(validateOtp('12345')).toBeTruthy()
    expect(validateOtp('1234567')).toBeTruthy()
  })
  it('requires an eight character matching password', () => {
    expect(validatePassword('12345678', '12345678')).toBe('')
    expect(validatePassword('short', 'short')).toBeTruthy()
    expect(validatePassword('12345678', '87654321')).toBeTruthy()
  })
})
