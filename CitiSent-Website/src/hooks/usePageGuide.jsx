import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { findComponentGuide, getGuideForPage } from '../models/pageGuideModel'
import { loadFromStorage, saveToStorage } from '../services/storageService'

const STORAGE_KEY_COMPLETED_TOURS = 'citisent_completed_page_tours'

const GuideContext = createContext(null)

export function GuideProvider({ children, activePage }) {
  const [isTourActive, setIsTourActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [standaloneGuideItem, setStandaloneGuideItem] = useState(null)
  const [targetAnchorRect, setTargetAnchorRect] = useState(null)
  const [currentSelector, setCurrentSelector] = useState(null)
  const [currentAnchorElement, setCurrentAnchorElement] = useState(null)
  const [completedTours, setCompletedTours] = useState(() => {
    return loadFromStorage(STORAGE_KEY_COMPLETED_TOURS, [])
  })

  // Get all guide steps for the current page
  const pageGuideEntry = useMemo(() => getGuideForPage(activePage), [activePage])
  const activePageSteps = useMemo(() => pageGuideEntry?.steps || [], [pageGuideEntry])

  // Reset or close tour when active page changes
  useEffect(() => {
    setIsTourActive(false)
    setCurrentStepIndex(0)
    setStandaloneGuideItem(null)
    setTargetAnchorRect(null)
    setCurrentSelector(null)
    setCurrentAnchorElement(null)
  }, [activePage])

  // Global Escape key listener to dismiss active guides
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeGuide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTourActive, standaloneGuideItem])

  // Keep target anchor rect updated on scroll and window resize
  useEffect(() => {
    if (!isTourActive && !standaloneGuideItem) return

    function handleUpdate() {
      if (currentAnchorElement && typeof currentAnchorElement.getBoundingClientRect === 'function') {
        const rect = currentAnchorElement.getBoundingClientRect()
        setTargetAnchorRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
          pageTop: rect.top + (window.scrollY || 0),
          pageLeft: rect.left + (window.scrollX || 0),
        })
      } else if (currentSelector && typeof document !== 'undefined') {
        const el = document.querySelector(currentSelector)
        if (el) {
          const rect = el.getBoundingClientRect()
          setTargetAnchorRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right,
            pageTop: rect.top + (window.scrollY || 0),
            pageLeft: rect.left + (window.scrollX || 0),
          })
        }
      }
    }

    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate, { passive: true })
    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate)
    }
  }, [isTourActive, standaloneGuideItem, currentSelector, currentAnchorElement])

  function closeGuide() {
    setIsTourActive(false)
    setCurrentStepIndex(0)
    setStandaloneGuideItem(null)
    setTargetAnchorRect(null)
    setCurrentSelector(null)
    setCurrentAnchorElement(null)
  }

  function startTour(targetPageKey = activePage) {
    const entry = getGuideForPage(targetPageKey)
    if (!entry || !entry.steps?.length) return

    setStandaloneGuideItem(null)
    setCurrentStepIndex(0)
    setIsTourActive(true)

    // Position on first target element
    const firstTarget = entry.steps[0]
    setCurrentSelector(firstTarget.targetSelector)
    setCurrentAnchorElement(null)
    updateAnchorFromSelector(firstTarget.targetSelector)
  }

  function endTour() {
    if (activePage && !completedTours.includes(activePage)) {
      const updated = [...completedTours, activePage]
      setCompletedTours(updated)
      saveToStorage(STORAGE_KEY_COMPLETED_TOURS, updated)
    }
    closeGuide()
  }

  function nextStep() {
    if (currentStepIndex < activePageSteps.length - 1) {
      const nextIndex = currentStepIndex + 1
      setCurrentStepIndex(nextIndex)
      setCurrentSelector(activePageSteps[nextIndex].targetSelector)
      setCurrentAnchorElement(null)
      updateAnchorFromSelector(activePageSteps[nextIndex].targetSelector)
    } else {
      endTour()
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1
      setCurrentStepIndex(prevIndex)
      setCurrentSelector(activePageSteps[prevIndex].targetSelector)
      setCurrentAnchorElement(null)
      updateAnchorFromSelector(activePageSteps[prevIndex].targetSelector)
    }
  }

  function openComponentGuide(componentId, anchorElement = null) {
    const item = findComponentGuide(componentId)
    if (!item) return

    setIsTourActive(false)
    setStandaloneGuideItem(item)
    setCurrentAnchorElement(anchorElement || null)
    setCurrentSelector(item.targetSelector || null)

    if (anchorElement && typeof anchorElement.getBoundingClientRect === 'function') {
      const rect = anchorElement.getBoundingClientRect()
      setTargetAnchorRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
        pageTop: rect.top + (window.scrollY || 0),
        pageLeft: rect.left + (window.scrollX || 0),
      })
    } else if (item.targetSelector) {
      updateAnchorFromSelector(item.targetSelector)
    } else {
      setTargetAnchorRect(null)
    }
  }

  function updateAnchorFromSelector(selector) {
    if (!selector) {
      setTargetAnchorRect(null)
      return
    }

    // Defer slightly to ensure DOM layout is settled
    setTimeout(() => {
      const el = document.querySelector(selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        const rect = el.getBoundingClientRect()
        setTargetAnchorRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
          pageTop: rect.top + (window.scrollY || 0),
          pageLeft: rect.left + (window.scrollX || 0),
        })
      } else {
        setTargetAnchorRect(null)
      }
    }, 50)
  }

  function hasCompletedTour(pageKey) {
    return completedTours.includes(pageKey)
  }

  const activeGuideItem = useMemo(() => {
    if (isTourActive && activePageSteps[currentStepIndex]) {
      return activePageSteps[currentStepIndex]
    }
    return standaloneGuideItem
  }, [isTourActive, activePageSteps, currentStepIndex, standaloneGuideItem])

  const value = {
    isTourActive,
    currentStepIndex,
    totalSteps: activePageSteps.length,
    activePageSteps,
    activeGuideItem,
    targetAnchorRect,
    startTour,
    endTour,
    nextStep,
    prevStep,
    openComponentGuide,
    closeGuide,
    hasCompletedTour,
  }

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>
}

export function usePageGuide() {
  const context = useContext(GuideContext)
  if (!context) {
    // Graceful fallback if invoked outside GuideProvider in isolated unit tests
    return {
      isTourActive: false,
      currentStepIndex: 0,
      totalSteps: 0,
      activePageSteps: [],
      activeGuideItem: null,
      targetAnchorRect: null,
      startTour: () => {},
      endTour: () => {},
      nextStep: () => {},
      prevStep: () => {},
      openComponentGuide: () => {},
      closeGuide: () => {},
      hasCompletedTour: () => false,
    }
  }
  return context
}
