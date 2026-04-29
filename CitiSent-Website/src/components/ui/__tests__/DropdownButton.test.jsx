/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DropdownButton } from '../DropdownButton'

describe('DropdownButton', () => {
  let container
  let root
  let requestAnimationFrameSpy
  let cancelAnimationFrameSpy

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0)
        return 1
      })
    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    requestAnimationFrameSpy.mockRestore()
    cancelAnimationFrameSpy.mockRestore()
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
  })

  it('opens without triggering the error boundary and still returns the selected value', async () => {
    const handleChange = vi.fn()

    await act(async () => {
      root.render(
        <DropdownButton
          label="Theme"
          value="System"
          onChange={handleChange}
          options={[
            { label: 'Light', value: 'Light' },
            { label: 'System', value: 'System' },
          ]}
        />
      )
    })

    const trigger = container.querySelector('button')
    expect(trigger?.textContent).toContain('System')

    await act(async () => {
      trigger.click()
    })

    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    const listbox = document.body.querySelector('[role="listbox"]')
    expect(listbox).not.toBeNull()
    expect(listbox.textContent).toContain('Light')

    const option = Array.from(document.body.querySelectorAll('[role="option"]')).find((node) =>
      String(node.textContent || '').includes('Light')
    )

    await act(async () => {
      option.click()
    })

    expect(handleChange).toHaveBeenCalledWith('Light')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
