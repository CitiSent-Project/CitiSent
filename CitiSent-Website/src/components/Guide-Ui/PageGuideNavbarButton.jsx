import { useEffect, useRef, useState } from 'react'
import { FiBookOpen, FiHelpCircle, FiPlay, FiX } from 'react-icons/fi'
import { usePageGuide } from '../../hooks/usePageGuide'
import { getGuideForPage } from '../../models/pageGuideModel'

export function PageGuideNavbarButton({ activePage }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { startTour, hasCompletedTour, openComponentGuide } = usePageGuide()

  const pageGuide = getGuideForPage(activePage)
  const hasGuide = Boolean(pageGuide?.steps?.length)
  const isCompleted = hasCompletedTour(activePage)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleStartTour() {
    setMenuOpen(false)
    startTour(activePage)
  }

  function handleInspectComponent(componentId) {
    setMenuOpen(false)
    openComponentGuide(componentId)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className={`relative grid h-9 w-9 place-items-center rounded-md border transition cursor-pointer before:content-[''] before:absolute before:-inset-1 before:rounded-md ${
          menuOpen
            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        }`}
        title="Page Guide & Mini-Manual"
        aria-label="Open page guide and mini-manual"
      >
        <FiHelpCircle className="text-base" />
        {!isCompleted && hasGuide && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          {/* Mobile backdrop to dismiss cleanly when tapping outside */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] sm:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl z-50 dark:border-slate-700/80 dark:bg-slate-800 animate-in fade-in zoom-in-95 duration-150 max-h-[82vh] flex flex-col">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <FiBookOpen className="text-base" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {pageGuide?.pageTitle || 'Page Guide'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Interactive mini-manual for this section
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <FiX className="text-sm" />
            </button>
          </div>

          {pageGuide?.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              {pageGuide.description}
            </p>
          )}

          {/* Quick Guided Tour Launch Banner */}
          {hasGuide ? (
            <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    Step-by-Step Walkthrough
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    {pageGuide.steps.length} components documented on this page
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartTour}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <FiPlay className="text-xs" />
                  Start Tour
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">
              No interactive guide registered for this specific route.
            </p>
          )}

          {/* Component Mini-Catalog List */}
          {hasGuide && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Included Features
              </p>
              {pageGuide.steps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleInspectComponent(step.id)}
                  className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60 transition cursor-pointer"
                >
                  <span className="font-medium truncate pr-2">{step.title}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                    Learn &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    )}
  </div>
  )
}
