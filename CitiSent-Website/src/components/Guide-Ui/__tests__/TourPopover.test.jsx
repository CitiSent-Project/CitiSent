/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourPopover } from '../TourPopover'

describe('TourPopover', () => {
  let container
  let root

  const mockItem = {
    id: 'test-component',
    title: 'Test Component Title',
    body: 'This is the detailed explanation for the component.',
    tip: 'Pro-tip for testing components.',
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
  })

  it('renders nothing when guideItem is null', () => {
    act(() => {
      root.render(<TourPopover guideItem={null} />)
    })
    expect(container.innerHTML).toBe('')
  })

  it('renders standalone component guide correctly', () => {
    const handleClose = vi.fn()
    const handleStartTour = vi.fn()

    act(() => {
      root.render(
        <TourPopover
          guideItem={mockItem}
          isTour={false}
          onClose={handleClose}
          onStartFullTour={handleStartTour}
        />
      )
    })

    expect(container.textContent).toContain('Test Component Title')
    expect(container.textContent).toContain('This is the detailed explanation for the component.')
    expect(container.textContent).toContain('Pro-tip for testing components.')
    expect(container.textContent).toContain('Take full page tour')
    expect(container.textContent).toContain('Got it, thanks!')

    const fullTourBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Take full page tour')
    )
    act(() => {
      fullTourBtn.click()
    })
    expect(handleStartTour).toHaveBeenCalledTimes(1)

    const gotItBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Got it, thanks!')
    )
    act(() => {
      gotItBtn.click()
    })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('renders multi-step tour mode with Next, Back, and Skip buttons', () => {
    const handleNext = vi.fn()
    const handlePrev = vi.fn()
    const handleSkip = vi.fn()
    const handleClose = vi.fn()

    // Step 1 of 3 (middle step)
    act(() => {
      root.render(
        <TourPopover
          guideItem={mockItem}
          isTour={true}
          stepIndex={1}
          totalSteps={3}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onClose={handleClose}
        />
      )
    })

    expect(container.textContent).toContain('Step 2 of 3')

    const buttons = Array.from(container.querySelectorAll('button'))
    const skipBtn = buttons.find((btn) => btn.textContent.includes('Skip Tour'))
    const backBtn = buttons.find((btn) => btn.textContent.includes('Back'))
    const nextBtn = buttons.find((btn) => btn.textContent.includes('Next'))

    expect(skipBtn).toBeDefined()
    expect(backBtn).toBeDefined()
    expect(nextBtn).toBeDefined()

    act(() => {
      nextBtn.click()
    })
    expect(handleNext).toHaveBeenCalledTimes(1)

    act(() => {
      backBtn.click()
    })
    expect(handlePrev).toHaveBeenCalledTimes(1)

    act(() => {
      skipBtn.click()
    })
    expect(handleSkip).toHaveBeenCalledTimes(1)
  })

  it('renders "Got it, thanks!" on the last step of a tour', () => {
    const handleNext = vi.fn()

    act(() => {
      root.render(
        <TourPopover
          guideItem={mockItem}
          isTour={true}
          stepIndex={2}
          totalSteps={3}
          onNext={handleNext}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
          onClose={vi.fn()}
        />
      )
    })

    expect(container.textContent).toContain('Step 3 of 3')
    const nextBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent.includes('Got it, thanks!')
    )
    expect(nextBtn).toBeDefined()

    act(() => {
      nextBtn.click()
    })
    expect(handleNext).toHaveBeenCalledTimes(1)
  })
})
