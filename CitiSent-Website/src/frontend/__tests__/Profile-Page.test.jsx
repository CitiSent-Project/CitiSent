import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ProfileInformation } from '../Pages/ProfilePage'

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  let callCount = 0

  return {
    ...actual,
    useState: vi.fn((initialValue) => {
      callCount += 1

      if (callCount === 1) {
        return [true, vi.fn()]
      }

      if (callCount === 2) {
        return ['', vi.fn()]
      }

      if (callCount === 3) {
        return [null, vi.fn()]
      }

      if (callCount === 4) {
        return [
          {
            fname: 'BPLO',
            mname: '',
            lname: 'Admin',
            fullName: 'BPLO Admin',
            username: 'bplo.admin',
            email: 'bplo.admin@citisent.gov',
            department: 'Business Permits and Licensing Office (BPLO)',
            phone: '0900',
            address: 'City Hall',
          },
          vi.fn(),
        ]
      }

      return [initialValue, vi.fn()]
    }),
  }
})

vi.mock('../../components/Account-Ui', () => ({
  ProfileSummaryCard: ({ profile }) => <aside data-testid="summary-card">{profile.fullName}</aside>,
}))

vi.mock('../../models/data', () => ({
  formatDateTime: (value) => value,
}))

describe('ProfileInformation', () => {
  it('renders a single editable email field and no duplicated phone or address inputs', () => {
    const html = renderToStaticMarkup(
      <ProfileInformation
        profile={{
          id: 'admin-1',
          role: 'Office Admin',
          fname: 'BPLO',
          mname: '',
          lname: 'Admin',
          fullName: 'BPLO Admin',
          username: 'bplo.admin',
          email: 'bplo.admin@citisent.gov',
          department: 'Business Permits and Licensing Office (BPLO)',
          phone: '0900',
          address: 'City Hall',
        }}
        activityLog={[]}
        transferRequests={[]}
        onUpdateProfile={vi.fn()}
        onSubmitTransferRequest={vi.fn()}
        departmentOptions={[
          { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
          { id: 'cto', label: 'City Treasury Office' },
        ]}
      />
    )

    expect(html).toContain('bplo.admin@citisent.gov')
    expect((html.match(/>Email</g) || []).length).toBe(1)
    expect((html.match(/>Phone</g) || []).length).toBe(1)
    expect((html.match(/>Address</g) || []).length).toBe(1)
    expect((html.match(/>Username</g) || []).length).toBe(0)
  })
})