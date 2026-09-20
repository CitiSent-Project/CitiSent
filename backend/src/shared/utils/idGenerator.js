import crypto from "crypto";

/**
 * Minimum and maximum bounds for a 6-digit user ID.
 * Range: 100,000 to 999,999 (900,000 possible unique IDs).
 * Avoiding leading zeros prevents numeric parser and spreadsheet truncation bugs.
 */
export const MIN_6_DIGIT_ID = 100000;
export const MAX_6_DIGIT_ID = 999999;

/**
 * Generates a cryptographically secure random 6-digit numeric string.
 * @returns {string} Exactly 6 numeric digits (e.g., "849201").
 */
export function generate6DigitId() {
  return crypto.randomInt(MIN_6_DIGIT_ID, MAX_6_DIGIT_ID + 1).toString();
}

/**
 * Validates whether a value is a valid 6-digit User ID.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValid6DigitId(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }
  const str = String(value).trim();
  return /^[1-9]\d{5}$/.test(str);
}
