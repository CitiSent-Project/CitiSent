/**
 * Core password validation and strength evaluation for CitiSent administrators.
 * Enforces modern security standards:
 * - Minimum 12 characters, maximum 128 characters
 * - Character diversity: uppercase, lowercase, numbers, special symbols
 * - Reject whitespace
 * - Block known common passwords, dictionary words, and sequential patterns
 */

export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 128

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/
export const WHITESPACE_REGEX = /\s/
export const UPPERCASE_REGEX = /[A-Z]/
export const LOWERCASE_REGEX = /[a-z]/
export const DIGIT_REGEX = /[0-9]/

export const COMMON_PASSWORD_LIST = [
  'password',
  'password1',
  'password123',
  'admin',
  'administrator',
  'citisent',
  'batangas',
  'santotomas',
  'stotomas',
  'qwerty',
  'qwertyuiop',
  'asdfgh',
  'asdfghjkl',
  'zxcvbn',
  'zxcvbnm',
  'letmein',
  'welcome',
  'welcome1',
  'welcome123',
  'changeme',
  'iloveyou',
  'secret',
  'supersecret',
  'master',
  'dragon',
  'football',
  'baseball',
  'basketball',
  'monkey',
  'shadow',
  'sunshine',
  'princess',
  'trustno1',
  'default',
  'passcode',
  'testing',
  'test1234',
  'access',
  'freedom',
  'computer',
  'system',
  'office',
  'government',
  'public',
  'philippines',
]

/**
 * Replaces common leetspeak substitutions to normalize text for dictionary matching.
 */
function normalizeLeet(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/4/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
}

/**
 * Generates forward and reverse sequential substrings of specified length.
 */
function extractSequences(source, length = 4) {
  const sequences = new Set()
  const lower = source.toLowerCase()
  for (let i = 0; i <= lower.length - length; i++) {
    const forward = lower.slice(i, i + length)
    sequences.add(forward)
    sequences.add(forward.split('').reverse().join(''))
  }
  return Array.from(sequences)
}

const KEYBOARD_SEQUENCES = [
  ...extractSequences('qwertyuiop', 4),
  ...extractSequences('asdfghjkl', 4),
  ...extractSequences('zxcvbnm', 4),
]

const ALPHABET_SEQUENCES = extractSequences('abcdefghijklmnopqrstuvwxyz', 4)
const NUMBER_SEQUENCES = extractSequences('01234567890', 4)

/**
 * Checks if a proposed password contains known common passwords, dictionary words,
 * keyboard walks, sequential runs, or repeated character sequences.
 */
export function checkCommonOrSequential(password) {
  if (!password || typeof password !== 'string') {
    return { isBlocked: false, reason: '' }
  }

  const raw = password
  const lower = raw.toLowerCase()
  const leet = normalizeLeet(raw)

  // 1. Common passwords & dictionary words (substring or whole match)
  for (const word of COMMON_PASSWORD_LIST) {
    if (lower.includes(word) || leet.includes(word)) {
      return {
        isBlocked: true,
        reason: `Avoid common passwords or dictionary words like "${word}".`,
      }
    }
  }

  // 2. Sequential keyboard patterns (e.g., qwerty, asdf, zxcv)
  for (const seq of KEYBOARD_SEQUENCES) {
    if (lower.includes(seq)) {
      return {
        isBlocked: true,
        reason: `Avoid sequential keyboard patterns like "${seq}".`,
      }
    }
  }

  // 3. Alphabetical sequences (e.g., abcd, dcba)
  for (const seq of ALPHABET_SEQUENCES) {
    if (lower.includes(seq)) {
      return {
        isBlocked: true,
        reason: `Avoid alphabetical sequences like "${seq}".`,
      }
    }
  }

  // 4. Numerical sequences (e.g., 1234, 4321, 9876)
  for (const seq of NUMBER_SEQUENCES) {
    if (raw.includes(seq)) {
      return {
        isBlocked: true,
        reason: `Avoid sequential numbers like "${seq}".`,
      }
    }
  }

  // 5. Repeated consecutive characters (4+ of the same character, e.g. aaaa, 1111, !!!!)
  const repeatedMatch = /(.)\1{3,}/.exec(raw)
  if (repeatedMatch) {
    return {
      isBlocked: true,
      reason: `Avoid repeated characters like "${repeatedMatch[0]}".`,
    }
  }

  return { isBlocked: false, reason: '' }
}

/**
 * Comprehensive evaluation of password criteria, returning granular rule states,
 * strength score, and feedback.
 */
export function evaluatePassword(password = '', confirmation = '') {
  const pwd = String(password || '')
  const conf = String(confirmation || '')

  const hasLength = pwd.length >= MIN_PASSWORD_LENGTH && pwd.length <= MAX_PASSWORD_LENGTH
  const hasMinLength = pwd.length >= MIN_PASSWORD_LENGTH
  const withinMaxLength = pwd.length <= MAX_PASSWORD_LENGTH
  const hasUppercase = UPPERCASE_REGEX.test(pwd)
  const hasLowercase = LOWERCASE_REGEX.test(pwd)
  const hasNumber = DIGIT_REGEX.test(pwd)
  const hasSpecial = SPECIAL_CHAR_REGEX.test(pwd)
  const noWhitespace = pwd.length > 0 && !WHITESPACE_REGEX.test(pwd)

  const commonCheck = checkCommonOrSequential(pwd)
  const notCommon = pwd.length > 0 && !commonCheck.isBlocked

  const matchesConfirmation = conf.length > 0 ? pwd === conf : false

  // Strength score calculation (0 to 5)
  let score = 0
  if (pwd.length > 0) {
    if (hasMinLength) score += 1
    if (hasUppercase && hasLowercase) score += 1
    if (hasNumber) score += 1
    if (hasSpecial) score += 1
    if (noWhitespace && notCommon) score += 1

    // Cap score at 1 if common dictionary word or sequential pattern detected
    if (commonCheck.isBlocked) {
      score = Math.min(score, 1)
    }

    // Cap score if length is very short
    if (pwd.length < 8) {
      score = Math.min(score, 1)
    }
  }

  let strengthLabel = 'Very Weak'
  let strengthColor = 'rose'

  if (score >= 5) {
    strengthLabel = 'Strong'
    strengthColor = 'emerald'
  } else if (score === 4) {
    strengthLabel = 'Good'
    strengthColor = 'sky'
  } else if (score === 3) {
    strengthLabel = 'Fair'
    strengthColor = 'amber'
  } else if (score === 2) {
    strengthLabel = 'Weak'
    strengthColor = 'orange'
  } else {
    strengthLabel = pwd.length === 0 ? '' : 'Very Weak'
    strengthColor = 'rose'
  }

  const isValid =
    hasLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    noWhitespace &&
    notCommon

  return {
    rules: {
      minLength: hasMinLength,
      maxLength: withinMaxLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      noWhitespace,
      notCommon,
      matchesConfirmation,
    },
    commonReason: commonCheck.reason,
    score,
    strengthLabel,
    strengthColor,
    isValid,
  }
}

/**
 * Validates a password and confirmation for form submission.
 * Returns an error string if invalid, or empty string if valid.
 */
export function validatePassword(password, confirmation) {
  if (!password) {
    return 'Please enter a password.'
  }

  if (WHITESPACE_REGEX.test(password)) {
    return 'Password must not contain spaces or whitespace characters.'
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must not exceed ${MAX_PASSWORD_LENGTH} characters.`
  }

  if (!UPPERCASE_REGEX.test(password)) {
    return 'Password must include at least one uppercase letter (A-Z).'
  }

  if (!LOWERCASE_REGEX.test(password)) {
    return 'Password must include at least one lowercase letter (a-z).'
  }

  if (!DIGIT_REGEX.test(password)) {
    return 'Password must include at least one number (0-9).'
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return 'Password must include at least one special symbol (!@#$%^&*).'
  }

  const commonCheck = checkCommonOrSequential(password)
  if (commonCheck.isBlocked) {
    return commonCheck.reason || 'Password is too common or easily guessable.'
  }

  if (confirmation !== undefined && confirmation !== null && password !== confirmation) {
    return 'Passwords do not match.'
  }

  return ''
}
