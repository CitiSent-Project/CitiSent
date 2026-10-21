/**
 * Philippine Mobile Phone Number Utilities
 *
 * Valid formats in the Philippines:
 * - 09XXXXXXXXX (11 digits, standard local format)
 * - +639XXXXXXXXX (13 chars, standard E.164 international format)
 * - 639XXXXXXXXX (12 digits)
 * - 9XXXXXXXXX (10 digits without leading 0 or +63)
 */

const PH_MOBILE_REGEX = /^(?:\+?63|0)?(9\d{9})$/;

/**
 * Normalizes any Philippine mobile phone number representation into clean formats.
 *
 * @param {string} input - Raw phone input
 * @returns {{
 *   isValid: boolean,
 *   local: string | null,      // e.g. "09171234567"
 *   e164: string | null,       // e.g. "+639171234567"
 *   digits: string | null,     // e.g. "639171234567"
 *   tenDigits: string | null   // e.g. "9171234567"
 * }}
 */
export function normalizePhilippinePhoneNumber(input) {
  if (input === null || input === undefined) {
    return {
      isValid: false,
      local: null,
      e164: null,
      digits: null,
      tenDigits: null,
    };
  }

  const trimmed = String(input).trim();
  // Strip spaces, dashes, parentheses
  const cleaned = trimmed.replace(/[\s\-()]/g, "");

  const match = cleaned.match(PH_MOBILE_REGEX);
  if (!match) {
    return {
      isValid: false,
      local: null,
      e164: null,
      digits: null,
      tenDigits: null,
    };
  }

  const tenDigits = match[1]; // e.g. "9171234567"

  return {
    isValid: true,
    local: `0${tenDigits}`,
    e164: `+63${tenDigits}`,
    digits: `63${tenDigits}`,
    tenDigits,
  };
}

/**
 * Checks whether an input is a valid Philippine mobile phone number.
 * @param {string} input
 * @returns {boolean}
 */
export function isValidPhilippineMobile(input) {
  return normalizePhilippinePhoneNumber(input).isValid;
}

/**
 * Partially masks a phone number for UI display and privacy protection.
 * e.g. "+639171234567" -> "+63 9•• ••• 4567"
 * e.g. "09171234567"   -> "+63 9•• ••• 4567"
 *
 * @param {string} input
 * @returns {string}
 */
export function maskPhoneNumber(input) {
  const norm = normalizePhilippinePhoneNumber(input);
  if (!norm.isValid) {
    const raw = String(input || "").trim();
    if (raw.length <= 4) return raw;
    return `••••${raw.slice(-4)}`;
  }

  const ten = norm.tenDigits; // 9171234567
  const prefix = ten.slice(0, 1); // "9"
  const lastFour = ten.slice(-4); // "4567"

  return `+63 ${prefix}•• ••• ${lastFour}`;
}
