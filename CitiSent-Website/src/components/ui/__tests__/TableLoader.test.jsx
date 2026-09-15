/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TableLoader } from '../TableLoader'

describe('TableLoader', () => {
  let container
  let root
  let originalActEnvironment

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT
    globalThis.IS_REACT_ACT_ENVIRONMENT = true

    vi.useFakeTimers()

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })

    container.remove()
    vi.useRealTimers()
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment
  })

  it('shows the table loader after the default 300ms delay', async () => {
    await act(async () => {
      root.render(
        <table>
          <thead>
            <tr>
              <th>Column</th>
            </tr>
          </thead>
          <TableLoader isLoading rows={3} columns={1} />
        </table>,
      )
    })

    expect(document.body.textContent).not.toContain('Loading table data...')

    await act(async () => {
      vi.advanceTimersByTime(299)
    })

    expect(document.body.textContent).not.toContain('Loading table data...')

    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(document.body.textContent).toContain('Loading table data...')
    expect(document.body.querySelector('[role="status"]')).toBeTruthy()
  })


  it('shows a refreshing banner immediately when delayMs is 0', async () => {
    await act(async () => {
      root.render(
        <table>
          <thead>
            <tr>
              <th>Column</th>
            </tr>
          </thead>
          <TableLoader
            isLoading
            delayMs={0}
            rows={3}
            columns={1}
            variant="refreshing"
            label="Refreshing table..."
            refreshText="Refreshing..."
          />
        </table>,
      )
    })

    expect(document.body.textContent).toContain('Refreshing table...')
    expect(document.body.textContent).toContain('Refreshing...')
    expect(document.body.querySelector('[role="status"]')).toBeTruthy()
  })

  it('renders users-grid layout with status accessibility role', async () => {
    await act(async () => {
      root.render(
        <TableLoader
          isLoading
          delayMs={0}
          layout="users-grid"
          rows={3}
          label="Loading users..."
        />,
      )
    })

    expect(document.body.textContent).toContain('Loading users...')
    const statusContainer = document.body.querySelector('[role="status"]')
    expect(statusContainer).toBeTruthy()
    expect(statusContainer.getAttribute('aria-busy')).toBe('true')
  })
})