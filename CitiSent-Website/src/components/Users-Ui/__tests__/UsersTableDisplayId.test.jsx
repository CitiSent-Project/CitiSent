import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { UsersTable } from '../UsersTable'

describe('UsersTable - displayId rendering', () => {
  it('renders 6-digit displayId (e.g. ID: 849201) when displayId is provided', () => {
    const html = renderToStaticMarkup(
      <UsersTable
        users={[
          {
            id: 'c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d',
            displayId: '849201',
            email: 'janedoe13@gmail.com',
            status: 'Active',
            registeredAt: 'September 20, 2026',
          },
        ]}
        selectedUserIds={[]}
        onToggleSelectUser={() => {}}
        onToggleSelectAllUsers={() => {}}
        onViewUser={() => {}}
        onEditUser={() => {}}
        onToggleBanUser={() => {}}
        onDeleteUser={() => {}}
        canToggleBan={true}
        isLoading={false}
        processingUserIds={new Set()}
      />,
    )

    // Should display the 6-digit User ID
    expect(html).toContain('ID: 849201')
    // Should NOT display the raw UUID as the visible ID text
    expect(html).not.toContain('ID: c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d')
  })

  it('falls back to id when displayId is not provided', () => {
    const html = renderToStaticMarkup(
      <UsersTable
        users={[
          {
            id: 'legacy-uuid-1234',
            displayId: '',
            email: 'legacy@gmail.com',
            status: 'Active',
            registeredAt: 'September 19, 2026',
          },
        ]}
        selectedUserIds={[]}
        onToggleSelectUser={() => {}}
        onToggleSelectAllUsers={() => {}}
        onViewUser={() => {}}
        onEditUser={() => {}}
        onToggleBanUser={() => {}}
        onDeleteUser={() => {}}
        canToggleBan={true}
        isLoading={false}
        processingUserIds={new Set()}
      />,
    )

    expect(html).toContain('ID: legacy-uuid-1234')
  })
})
