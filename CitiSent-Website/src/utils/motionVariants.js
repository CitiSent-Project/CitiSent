/**
 * Shared Framer Motion Variants & Animation Tokens for CitiSent-Website
 *
 * Provides centralized easing curves, spring physics, and variants for:
 * - Page route transitions
 * - Modal overlays & dialog cards
 * - List & table rows
 * - Dropdown & popover menus
 * - Interactive micro-interactions
 */

export const TRANSITION_EASE = [0.16, 1, 0.3, 1]

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: TRANSITION_EASE },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
}

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

export const modalCardVariants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: TRANSITION_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
}

export const tableRowVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

export const dropdownMenuVariants = {
  initial: { opacity: 0, scale: 0.97, y: -6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: TRANSITION_EASE,
      staggerChildren: 0.02,
      delayChildren: 0.01,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
}

export const dropdownItemVariants = {
  initial: { opacity: 0, x: -4 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
}

export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.15, ease: 'easeOut' },
}

export const cardHover = {
  whileHover: { y: -2 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

/**
 * Returns reduced-motion compliant variants when requested.
 */
export function getMotionVariants(variants, prefersReducedMotion) {
  if (!prefersReducedMotion) return variants
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0 } },
    exit: { opacity: 0, transition: { duration: 0 } },
  }
}
