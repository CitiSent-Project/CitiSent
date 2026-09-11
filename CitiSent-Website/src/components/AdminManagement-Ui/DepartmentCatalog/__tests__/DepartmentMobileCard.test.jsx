import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DepartmentMobileCard } from '../DepartmentMobileCard'

describe('DepartmentMobileCard', () => {
  const mockDept = {
    id: 'ctmd',
    label: 'City Traffic Management Division/Impounding Services',
    isActive: true,
    logoUrl: 'https://example.com/ctmd.png',
  }

  it('renders department label, code badge, active status pill, and action buttons cleanly', () => {
    const html = renderToStaticMarkup(
      <DepartmentMobileCard
        department={mockDept}
        isBusy={false}
        logoError=""
        onLogoFileChange={vi.fn()}
        onOpenRemoveLogoModal={vi.fn()}
        onOpenRenameModal={vi.fn()}
        onToggleDepartmentActive={vi.fn()}
        onOpenDeleteModal={vi.fn()}
      />
    )

    expect(html).toContain('City Traffic Management Division/Impounding Services')
    expect(html).toContain('ctmd')
    expect(html).toContain('Active')
    expect(html).toContain('Replace Logo')
    expect(html).toContain('Rename')
    expect(html).toContain('Delete')
    expect(html).toContain('Remove')
  })

  it('renders inactive badge and upload logo button when no logo is set', () => {
    const inactiveDept = {
      id: 'cto',
      label: 'City Treasury Office',
      isActive: false,
      logoUrl: '',
    }

    const html = renderToStaticMarkup(
      <DepartmentMobileCard
        department={inactiveDept}
        isBusy={false}
        logoError=""
        onLogoFileChange={vi.fn()}
        onOpenRemoveLogoModal={vi.fn()}
        onOpenRenameModal={vi.fn()}
        onToggleDepartmentActive={vi.fn()}
        onOpenDeleteModal={vi.fn()}
      />
    )

    expect(html).toContain('City Treasury Office')
    expect(html).toContain('Inactive')
    expect(html).toContain('Upload Logo')
  })
})
