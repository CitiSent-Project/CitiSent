import { describe, expect, it } from 'vitest'
import {
  checkCommonOrSequential,
  evaluatePassword,
  validatePassword,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '../passwordValidation'

describe('passwordValidation', () => {
  describe('validatePassword', () => {
    it('rejects empty passwords', () => {
      expect(validatePassword('', '')).toBe('Please enter a password.')
      expect(validatePassword(null, '')).toBe('Please enter a password.')
    })

    it('rejects passwords containing spaces or whitespace', () => {
      expect(validatePassword('Strong Pass1!', 'Strong Pass1!')).toBe(
        'Password must not contain spaces or whitespace characters.'
      )
      expect(validatePassword(' StrongPass1!', ' StrongPass1!')).toBe(
        'Password must not contain spaces or whitespace characters.'
      )
      expect(validatePassword('StrongPass1!\t', 'StrongPass1!\t')).toBe(
        'Password must not contain spaces or whitespace characters.'
      )
    })

    it('enforces minimum length of 12 characters', () => {
      expect(validatePassword('Str0ng!Pass', 'Str0ng!Pass')).toBe(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      )
    })

    it('enforces maximum length of 128 characters', () => {
      const longPass = 'A!1' + 'a'.repeat(126)
      expect(validatePassword(longPass, longPass)).toBe(
        `Password must not exceed ${MAX_PASSWORD_LENGTH} characters.`
      )
    })

    it('mandates uppercase characters', () => {
      expect(validatePassword('str0ng!passw1', 'str0ng!passw1')).toBe(
        'Password must include at least one uppercase letter (A-Z).'
      )
    })

    it('mandates lowercase characters', () => {
      expect(validatePassword('STR0NG!PASSW1', 'STR0NG!PASSW1')).toBe(
        'Password must include at least one lowercase letter (a-z).'
      )
    })

    it('mandates digit characters', () => {
      expect(validatePassword('Strong!Passwd', 'Strong!Passwd')).toBe(
        'Password must include at least one number (0-9).'
      )
    })

    it('mandates special symbols', () => {
      expect(validatePassword('Str0ngPasswd1', 'Str0ngPasswd1')).toBe(
        'Password must include at least one special symbol (!@#$%^&*).'
      )
    })

    it('blocks known common passwords and dictionary words', () => {
      expect(validatePassword('Password123!@#', 'Password123!@#')).toContain('Avoid common passwords')
      expect(validatePassword('Admin@2026Office!', 'Admin@2026Office!')).toContain('Avoid common passwords')
      expect(validatePassword('CitiSentSecure!1', 'CitiSentSecure!1')).toContain('Avoid common passwords')
      expect(validatePassword('Welcome!2026#Xy', 'Welcome!2026#Xy')).toContain('Avoid common passwords')
    })

    it('blocks leetspeak dictionary variants', () => {
      expect(validatePassword('P@ssw0rd!#2026', 'P@ssw0rd!#2026')).toContain('Avoid common passwords')
    })

    it('blocks keyboard walk sequences', () => {
      expect(validatePassword('Poiuy!98765432', 'Poiuy!98765432')).toContain('Avoid sequential keyboard patterns')
      expect(validatePassword('Werty!98765432', 'Werty!98765432')).toContain('Avoid sequential keyboard patterns')
    })

    it('blocks alphabetical sequences', () => {
      expect(validatePassword('Abcd#Efgh!9876', 'Abcd#Efgh!9876')).toContain('Avoid alphabetical sequences')
    })

    it('blocks numerical sequences', () => {
      expect(validatePassword('Str0ng!#123456', 'Str0ng!#123456')).toContain('Avoid sequential numbers')
      expect(validatePassword('Str0ng!#432100', 'Str0ng!#432100')).toContain('Avoid sequential numbers')
    })

    it('blocks repeated character sequences', () => {
      expect(validatePassword('Str0ng!aaaaZZ1', 'Str0ng!aaaaZZ1')).toContain('Avoid repeated characters')
      expect(validatePassword('Str0ng!1111ZZ#', 'Str0ng!1111ZZ#')).toContain('Avoid repeated characters')
    })

    it('rejects confirmation mismatch', () => {
      const valid = 'K9#mP$2vL!q8'
      expect(validatePassword(valid, 'Different123!')).toBe('Passwords do not match.')
    })

    it('accepts a strong, compliant password with matching confirmation', () => {
      const valid = 'K9#mP$2vL!q8'
      expect(validatePassword(valid, valid)).toBe('')
    })
  })

  describe('checkCommonOrSequential', () => {
    it('returns isBlocked: false for safe passwords', () => {
      expect(checkCommonOrSequential('K9#mP$2vL!q8').isBlocked).toBe(false)
    })

    it('detects common words case-insensitively', () => {
      expect(checkCommonOrSequential('mYpAsSwOrD!123').isBlocked).toBe(true)
    })
  })

  describe('evaluatePassword', () => {
    it('evaluates rule states and strength scoring accurately', () => {
      const empty = evaluatePassword('', '')
      expect(empty.isValid).toBe(false)
      expect(empty.score).toBe(0)
      expect(empty.strengthLabel).toBe('')

      const weak = evaluatePassword('password123', 'password123')
      expect(weak.isValid).toBe(false)
      expect(weak.score).toBeLessThanOrEqual(1)
      expect(weak.rules.notCommon).toBe(false)

      const strong = evaluatePassword('K9#mP$2vL!q8', 'K9#mP$2vL!q8')
      expect(strong.isValid).toBe(true)
      expect(strong.score).toBe(5)
      expect(strong.strengthLabel).toBe('Strong')
      expect(strong.strengthColor).toBe('emerald')
      expect(strong.rules.minLength).toBe(true)
      expect(strong.rules.hasUppercase).toBe(true)
      expect(strong.rules.hasLowercase).toBe(true)
      expect(strong.rules.hasNumber).toBe(true)
      expect(strong.rules.hasSpecial).toBe(true)
      expect(strong.rules.noWhitespace).toBe(true)
      expect(strong.rules.matchesConfirmation).toBe(true)
    })
  })
})
