/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfficeAdminAssignmentsSection } from '../OfficeAdminAssignmentsSection'

describe('OfficeAdminAssignmentsSection', () => {
  let container
  let root

  const departmentOptions = [
    { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
    { id: 'cto', label: 'City Treasury Office' },
  ]

  const sampleAdmins = [
    {
      id: 'admin-1',
      fullName: 'Arnold Batum Bakal',
      email: 'arnold@example.com',
      departmentId: 'bplo',
      department: 'Business Permits and Licensing Office (BPLO)',
    },
  ]

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

  it('disables Save button when no department changes have been drafted', async () => {
    await act(async () => {
      root.render(
        <OfficeAdminAssignmentsSection
          totalOfficeUnread={0}
          searchTerm=""
          onSearchTermChange={vi.fn()}
          departmentFilter="all"
          onDepartmentFilterChange={vi.fn()}
          departmentOptions={departmentOptions}
          filteredOfficeAdmins={sampleAdmins}
          unreadByAdminId={{ 'admin-1': 0 }}
          getSelectedDepartmentId={(admin) => admin.departmentId}
          onDraftDepartmentChange={vi.fn()}
          onSaveAssignment={vi.fn()}
          onDeleteAdmin={vi.fn()}
        />
      )
    })

    const saveButtons = Array.from(container.querySelectorAll('button')).filter(
      (btn) => btn.textContent && btn.textContent.includes('Save')
    )
    expect(saveButtons.length).toBeGreaterThan(0)
    saveButtons.forEach((btn) => {
      expect(btn.hasAttribute('disabled')).toBe(true)
    })
  })

  it('enables Save button when draft department differs from current department', async () => {
    const handleSaveAssignment = vi.fn()

    await act(async () => {
      root.render(
        <OfficeAdminAssignmentsSection
          totalOfficeUnread={0}
          searchTerm=""
          onSearchTermChange={vi.fn()}
          departmentFilter="all"
          onDepartmentFilterChange={vi.fn()}
          departmentOptions={departmentOptions}
          filteredOfficeAdmins={sampleAdmins}
          unreadByAdminId={{ 'admin-1': 0 }}
          getSelectedDepartmentId={() => 'cto'}
          onDraftDepartmentChange={vi.fn()}
          onSaveAssignment={handleSaveAssignment}
          onDeleteAdmin={vi.fn()}
        />
      )
    })

    const saveButtons = Array.from(container.querySelectorAll('button')).filter(
      (btn) => btn.textContent && btn.textContent.includes('Save')
    )
    expect(saveButtons.length).toBeGreaterThan(0)
    saveButtons.forEach((btn) => {
      expect(btn.hasAttribute('disabled')).toBe(false)
    })

    await act(async () => {
      saveButtons[0].click()
    })

    expect(handleSaveAssignment).toHaveBeenCalledWith(sampleAdmins[0])
  })
})
