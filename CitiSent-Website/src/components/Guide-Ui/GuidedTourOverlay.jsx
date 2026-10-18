import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePageGuide } from '../../hooks/usePageGuide'
import { TourPopover } from './TourPopover'

export function GuidedTourOverlay() {
  const {
    isTourActive,
    activeGuideItem,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    endTour,
    closeGuide,
    startTour,
    targetAnchorRect,
  } = usePageGuide()

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false
  })

  const [popoverPosition, setPopoverPosition] = useState({ top: 120, left: 24, placement: 'center' })
  const popoverContainerRef = useRef(null)

  // Track viewport resize to dynamically switch between mobile bottom card and desktop floating popover
  useEffect(() => {
    function handleResize() {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Viewport-aware collision detection & multi-directional positioning on Tablet/Desktop (>= 640px)
  useEffect(() => {
    if (!activeGuideItem || isMobile || typeof window === 'undefined') return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 16
    const gap = 12

    // Measure or estimate popover dimensions
    const popoverWidth = Math.min(384, viewportWidth - (padding * 2))
    const popoverHeight = popoverContainerRef.current?.offsetHeight || 240

    if (!targetAnchorRect) {
      // Centered fallback if no anchor element found
      setPopoverPosition({
        top: Math.max(padding, (viewportHeight - popoverHeight) / 2),
        left: Math.max(padding, (viewportWidth - popoverWidth) / 2),
        placement: 'center',
      })
      return
    }

    const spaceBelow = viewportHeight - (targetAnchorRect.bottom + gap)
    const spaceAbove = targetAnchorRect.top - gap
    const spaceRight = viewportWidth - (targetAnchorRect.right + gap)
    const spaceLeft = targetAnchorRect.left - gap

    const targetCenterX = targetAnchorRect.left + (targetAnchorRect.width / 2)

    let top = 0
    let left = targetCenterX - (popoverWidth / 2)
    let placement = 'bottom'

    // Multi-directional placement logic:
    // 1. Below target
    if (spaceBelow >= popoverHeight + padding) {
      placement = 'bottom'
      top = targetAnchorRect.bottom + gap
    }
    // 2. Above target
    else if (spaceAbove >= popoverHeight + padding) {
      placement = 'top'
      top = targetAnchorRect.top - gap - popoverHeight
    }
    // 3. To the right (ideal for tall cards, charts, or sidebars)
    else if (spaceRight >= popoverWidth + padding) {
      placement = 'right'
      left = targetAnchorRect.right + gap
      top = Math.max(padding, Math.min(viewportHeight - popoverHeight - padding, targetAnchorRect.top))
    }
    // 4. To the left
    else if (spaceLeft >= popoverWidth + padding) {
      placement = 'left'
      left = targetAnchorRect.left - gap - popoverWidth
      top = Math.max(padding, Math.min(viewportHeight - popoverHeight - padding, targetAnchorRect.top))
    }
    // 5. In-viewport safe clamping (for massive elements spanning the screen)
    else {
      placement = 'inside'
      top = Math.max(padding, viewportHeight - popoverHeight - padding - 16)
      left = Math.max(padding, Math.min(viewportWidth - popoverWidth - padding, targetAnchorRect.right - popoverWidth - 20))
    }

    // Strict boundary enforcement (prevents any part from clipping off-screen)
    const clampedLeft = Math.max(padding, Math.min(viewportWidth - popoverWidth - padding, left))
    const clampedTop = Math.max(padding, Math.min(viewportHeight - popoverHeight - padding, top))

    setPopoverPosition({ top: clampedTop, left: clampedLeft, placement })
  }, [targetAnchorRect, activeGuideItem, isMobile])

  if (!activeGuideItem) return null

  const overlayContent = (
    <div className="guide-tour-root">
      {/* Dimmed backdrop for guided tours */}
      <div
        onClick={closeGuide}
        className={`fixed inset-0 z-40 transition-opacity ${
          isTourActive
            ? 'bg-slate-950/45 backdrop-blur-[1px] pointer-events-auto'
            : 'bg-transparent pointer-events-auto'
        }`}
        aria-hidden="true"
      />

      {/* Target Element Spotlight Ring (in tour mode) */}
      {isTourActive && targetAnchorRect && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(0, targetAnchorRect.top - 4),
            left: Math.max(0, targetAnchorRect.left - 4),
            width: Math.min(typeof window !== 'undefined' ? window.innerWidth : 1000, targetAnchorRect.width + 8),
            height: Math.min(typeof window !== 'undefined' ? window.innerHeight : 1000, targetAnchorRect.height + 8),
            pointerEvents: 'none',
          }}
          className="z-40 rounded-2xl ring-4 ring-blue-500/80 shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-200"
        />
      )}

      {/* Popover: Adaptive Bottom Card on Mobile (< 640px) vs Floating Card on Desktop/Tablet (>= 640px) */}
      <div
        ref={popoverContainerRef}
        style={
          isMobile
            ? { pointerEvents: 'auto' }
            : {
                position: 'fixed',
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
                pointerEvents: 'auto',
              }
        }
        className={`z-50 transition-all duration-200 animate-in fade-in zoom-in-95 ${
          isMobile
            ? 'fixed bottom-4 left-3 right-3 mx-auto w-auto max-w-[calc(100vw-1.5rem)]'
            : ''
        }`}
      >
        <TourPopover
          guideItem={activeGuideItem}
          isTour={isTourActive}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={endTour}
          onClose={closeGuide}
          onStartFullTour={() => startTour()}
        />
      </div>
    </div>
  )

  // Use createPortal to mount cleanly into document.body if in browser
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(overlayContent, document.body)
  }

  return overlayContent
}
