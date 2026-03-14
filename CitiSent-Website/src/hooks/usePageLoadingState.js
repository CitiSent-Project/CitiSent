import { useEffect } from 'react'

export function usePageLoadingState({
  activePage,
  isAuthenticated,
  isPageLoading,
  setIsPageLoading,
  delayMs = 420,
}) {
  useEffect(() => {
    if (!isAuthenticated || !isPageLoading) {
      return undefined
    }

    const loadingTimer = window.setTimeout(() => {
      setIsPageLoading(false)
    }, delayMs)

    return () => window.clearTimeout(loadingTimer)
  }, [activePage, delayMs, isAuthenticated, isPageLoading, setIsPageLoading])
}
