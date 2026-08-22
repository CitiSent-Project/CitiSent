// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileInformation } from '../Pages/ProfilePage'

vi.mock('../../components/Account-Ui', () => ({
  ProfileSummaryCard: ({ profile }) => <aside data-testid="summary-card">{profile.fullName}</aside>,
}))

vi.mock('../../models/data', () => ({
  formatDateTime: (value) => value,
}))

let root
let container
globalThis.IS_REACT_ACT_ENVIRONMENT = true

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

async function render(element) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(element)
  })
}

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount()
    })
  }
  container?.remove()
  root = null
  container = null
  vi.clearAllMocks()
})

describe('ProfileInformation', () => {
  it('renders a single editable email field and no duplicated phone or location inputs', async () => {
    const profile = {
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
      barangay: 'San Isidro Norte',
      city: 'Sto. Tomas',
      province: 'Batangas',
    }

    await render(
      <ProfileInformation
        profile={profile}
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

    // Initially shows Edit profile button
    const editButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent.includes('Edit profile')
    )
    expect(editButton).toBeDefined()

    // Click edit button to display the editable form
    await act(async () => {
      editButton.click()
    })

    const html = container.innerHTML

    expect(html).toContain('bplo.admin@citisent.gov')
    expect((html.match(/>Email</g) || []).length).toBe(1)
    expect((html.match(/>Phone</g) || []).length).toBe(1)
    expect((html.match(/>Barangay</g) || []).length).toBe(1)
    expect((html.match(/>City</g) || []).length).toBe(1)
    expect((html.match(/>Province</g) || []).length).toBe(1)
    expect((html.match(/>Username</g) || []).length).toBe(0)
  })
})