/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DropdownButton } from '../DropdownButton'

describe('DropdownButton', () => {
  let container
  let root
  let originalRequestAnimationFrame
  let originalCancelAnimationFrame
  let originalActEnvironment

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT
    globalThis.IS_REACT_ACT_ENVIRONMENT = true

    originalRequestAnimationFrame = window.requestAnimationFrame
    originalCancelAnimationFrame = window.cancelAnimationFrame
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(Date.now()), 0)
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle)

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })

    container.remove()
    window.requestAnimationFrame = originalRequestAnimationFrame
    window.cancelAnimationFrame = originalCancelAnimationFrame
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment
  })

  it('opens without triggering a render loop', async () => {
    const onChange = vi.fn()

    await act(async () => {
      root.render(
        <DropdownButton
          label="Theme"
          value="System"
          onChange={onChange}
          options={['Light', 'Dark', 'System']}
        />,
      )
    })

    const button = container.querySelector('button')
    expect(button).toBeTruthy()

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    })

    expect(document.body.textContent).toContain('Light')
    expect(document.body.textContent).toContain('Dark')
    expect(document.body.textContent).toContain('System')
    expect(document.body.querySelector('[role="listbox"]')).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
  })
})