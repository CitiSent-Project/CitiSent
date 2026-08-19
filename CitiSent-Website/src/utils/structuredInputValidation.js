/**
 * Rules for data that becomes an account or profile identifier. Keep these
 * intentionally narrower than free-form text (reports, messages, and notes),
 * where punctuation and emoji can be meaningful to the user.
 */
export const STRUCTURED_INPUT_RULES = {
  name: {
    pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ .'-]*$/,
    message: 'Names may contain letters, spaces, periods, apostrophes, and hyphens only.',
  },
  username: {
    pattern: /^[A-Za-z0-9_]*$/,
    message: 'Username may contain letters, numbers, and underscores only.',
  },
  email: {
    // This permits only the characters valid in the application email format.
    pattern: /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~@-]*$/,
    message: 'Email addresses cannot contain emoji or unsupported characters.',
  },
  phone: {
    pattern: /^[0-9+()\-\s]*$/,
    message: 'Phone numbers may contain digits, spaces, parentheses, hyphens, and a leading plus sign only.',
  },
  location: {
    pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,'-]*$/,
    message: 'This field may contain letters, numbers, spaces, periods, commas, apostrophes, and hyphens only.',
  },
  loginIdentifier: {
    pattern: /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~@-]*$/,
    message: 'Username or email cannot contain emoji or unsupported characters.',
  },
}

/**
 * Returns a message when a proposed value contains a character outside the
 * selected structured-data rule. Keeping the previous value prevents invalid
 * pasted text and emoji from reaching form state or API requests.
 */
export function getStructuredInputError(value, ruleName) {
  const rule = STRUCTURED_INPUT_RULES[ruleName]

  if (!rule || rule.pattern.test(String(value ?? ''))) {
    return ''
  }

  return rule.message
}
