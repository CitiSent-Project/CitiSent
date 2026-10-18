import { describe, expect, it } from 'vitest'
import {
  normalizeEmail,
  normalizeOtp,
  resolveSafeErrorMessage,
  validateEmail,
  validateOtp,
  validatePassword,
} from '../auth/passwordResetController'

describe('passwordResetController', () => {
  describe('email handling', () => {
    it('normalizes valid email addresses and rejects invalid ones', () => {
      expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com')
      expect(validateEmail('')).toBe('Please enter your email address.')
      expect(validateEmail('invalid')).toBe('Please enter a valid email address.')
      expect(validateEmail(' user@example.com ')).toBe('')
    })
  })

  describe('OTP handling', () => {
    it('accepts exactly six numeric OTP characters and strips non-digits', () => {
      expect(normalizeOtp('12a34567')).toBe('123456')
      expect(validateOtp('123456')).toBe('')
      expect(validateOtp('12345')).toBe('Enter the six-digit verification code.')
      expect(validateOtp('1234567')).toBe('Enter the six-digit verification code.')
    })
  })

  describe('password validation', () => {
    it('requires a strong matching password adhering to core security rules', () => {
      const validPass = 'K9#mP$2vL!q8'
      expect(validatePassword('', '')).toBe('Please enter a new password.')
      expect(validatePassword('short', 'short')).toBe('Password must be at least 12 characters long.')
      expect(validatePassword('NoSpecialChar12', 'NoSpecialChar12')).toBe('Password must include at least one special symbol (!@#$%^&*).')
      expect(validatePassword(validPass, 'DifferentPass1!')).toBe('Passwords do not match.')
      expect(validatePassword(validPass, validPass)).toBe('')
    })
  })

  describe('error normalization', () => {
    it('extracts rate limit error userMessage or falls back to default message', () => {
      expect(resolveSafeErrorMessage({ status: 429, userMessage: 'Too many requests' }, 'Fallback')).toBe(
        'Too many requests'
      )
      expect(resolveSafeErrorMessage({ status: 500 }, 'Fallback message')).toBe('Fallback message')
      expect(resolveSafeErrorMessage(null, 'Fallback message')).toBe('Fallback message')
    })
  })
})
