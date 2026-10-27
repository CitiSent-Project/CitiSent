/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AddAdminFormModal } from '../AddAdminFormModal'
import * as locationDataModule from '../../../services/locationData'

describe('AddAdminFormModal', () => {
  let container
  let root
  let requestAnimationFrameSpy
  let cancelAnimationFrameSpy

  const departmentOptions = [
    { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
    { id: 'cto', label: 'City Treasury Office' },
  ]

  const mockBarangays = ['Barangay I (Pob.)', 'San Antonio', 'San Isidro Norte']

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

    vi.spyOn(locationDataModule, 'fetchStoTomasBatangasBarangays').mockResolvedValue(mockBarangays)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    // Clean up any portals remaining in document.body
    document.querySelectorAll('[role="dialog"], [role="listbox"]').forEach((el) => el.remove())
    requestAnimationFrameSpy.mockRestore()
    cancelAnimationFrameSpy.mockRestore()
    vi.restoreAllMocks()
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
  })

  it('renders read-only city and province for Sto. Tomas, Batangas', async () => {
    await act(async () => {
      root.render(
        <AddAdminFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          departmentOptions={departmentOptions}
        />
      )
    })

    const cityInput = document.getElementById('new-admin-city')
    const provinceInput = document.getElementById('new-admin-province')

    expect(cityInput).not.toBeNull()
    expect(cityInput.value).toBe('Sto. Tomas')
    expect(cityInput.disabled).toBe(true)

    expect(provinceInput).not.toBeNull()
    expect(provinceInput.value).toBe('Batangas')
    expect(provinceInput.disabled).toBe(true)
  })

  it('loads Sto. Tomas barangays and populates the barangay dropdown', async () => {
    await act(async () => {
      root.render(
        <AddAdminFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          departmentOptions={departmentOptions}
        />
      )
    })

    expect(locationDataModule.fetchStoTomasBatangasBarangays).toHaveBeenCalled()

    const barangayButton = document.getElementById('new-admin-barangay')
    expect(barangayButton).not.toBeNull()
    expect(barangayButton.textContent).toContain('Select a barangay')

    // Open dropdown
    await act(async () => {
      barangayButton.click()
    })

    const options = Array.from(document.querySelectorAll('[role="option"]'))
    const optionLabels = options.map((opt) => opt.textContent.trim())

    expect(optionLabels).toContain('San Isidro Norte')
    expect(optionLabels).toContain('San Antonio')
    expect(optionLabels).toContain('Barangay I (Pob.)')
  })

  it('shows validation error when submitting without selecting a department', async () => {
    const handleSubmit = vi.fn()

    await act(async () => {
      root.render(
        <AddAdminFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
          departmentOptions={departmentOptions}
        />
      )
    })

    const form = document.querySelector('form')
    await act(async () => {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    })

    expect(handleSubmit).not.toHaveBeenCalled()
    const errorAlert = document.querySelector('[role="alert"]')
    expect(errorAlert).not.toBeNull()
    expect(errorAlert.textContent).toContain('Select a department')
  })

  it('shows validation error when submitting without selecting a barangay', async () => {
    const handleSubmit = vi.fn()

    await act(async () => {
      root.render(
        <AddAdminFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
          departmentOptions={departmentOptions}
        />
      )
    })

    // Select a department first
    const deptButton = document.getElementById('new-admin-department')
    await act(async () => {
      deptButton.click()
    })

    const bploOption = Array.from(document.querySelectorAll('[role="option"]')).find((opt) =>
      opt.textContent.includes('Business Permits')
    )
    await act(async () => {
      bploOption.click()
    })

    // Now submit without barangay
    const form = document.querySelector('form')
    await act(async () => {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    })

    expect(handleSubmit).not.toHaveBeenCalled()
    const errorAlert = document.querySelector('[role="alert"]')
    expect(errorAlert).not.toBeNull()
    expect(errorAlert.textContent).toContain('Select a barangay before saving this admin account.')
  })

  it('submits successfully when department and barangay are selected', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(true)

    await act(async () => {
      root.render(
        <AddAdminFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
          departmentOptions={departmentOptions}
        />
      )
    })

    // Fill required text inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"]')
    await act(async () => {
      inputs[0].value = 'Juan'
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Select department
    const deptButton = document.getElementById('new-admin-department')
    await act(async () => {
      deptButton.click()
    })
    const bploOption = Array.from(document.querySelectorAll('[role="option"]')).find((opt) =>
      opt.textContent.includes('Business Permits')
    )
    await act(async () => {
      bploOption.click()
    })

    // Select barangay
    const barangayButton = document.getElementById('new-admin-barangay')
    await act(async () => {
      barangayButton.click()
    })
    const sanIsidroOption = Array.from(document.querySelectorAll('[role="option"]')).find((opt) =>
      opt.textContent.includes('San Isidro Norte')
    )
    await act(async () => {
      sanIsidroOption.click()
    })

    // Submit form
    const form = document.querySelector('form')
    await act(async () => {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    })

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    const submittedData = handleSubmit.mock.calls[0][0]
    expect(submittedData.departmentId).toBe('bplo')
    expect(submittedData.barangay).toBe('San Isidro Norte')
    expect(submittedData.city).toBe('Sto. Tomas')
    expect(submittedData.province).toBe('Batangas')
  })
})
