import { useState } from 'react'

/**
 * Retains the last non-null/non-undefined value across re-renders.
 * Useful for exit animations in modals/dialogs where parent components
 * clear active item state simultaneously with closing the modal.
 *
 * Implemented using React's official "storing information from previous renders" pattern.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function useLastNonNull(value) {
  const [cached, setCached] = useState(value)

  if (value != null && value !== cached) {
    setCached(value)
  }

  return value ?? cached
}
