import { FiHelpCircle } from 'react-icons/fi'
import { usePageGuide } from '../../hooks/usePageGuide'

export function ComponentGuideTrigger({
  guideId,
  title = 'What is this component?',
  className = '',
}) {
  const { openComponentGuide, isTourActive, activeGuideItem } = usePageGuide()

  if (!guideId) return null

  const isCurrentTourTarget = isTourActive && activeGuideItem?.id === guideId

  function handleClick(event) {
    event.stopPropagation()
    openComponentGuide(guideId, event.currentTarget)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={title}
      className={`group relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer before:content-[''] before:absolute before:-inset-2 before:rounded-full ${
        isCurrentTourTarget
          ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-500/50 shadow-xs dark:bg-blue-950/60 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-600 dark:hover:text-blue-300'
      } ${className}`}
    >
      <span className="text-[11px] font-bold font-sans">?</span>
      {isCurrentTourTarget && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>
      )}
    </button>
  )
}
