import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModalAccessibility({ isOpen, onClose, containerRef }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousFocusedElement = document.activeElement
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    const initialTarget = focusables[0] || container
    initialTarget.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const currentFocusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
      if (currentFocusables.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = currentFocusables[0]
      const last = currentFocusables[currentFocusables.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
        previousFocusedElement.focus()
      }
    }
  }, [containerRef, isOpen, onClose])
}
