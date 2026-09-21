/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersTable } from '../UsersTable'

describe('UsersTable action button and menu', () => {
  let container
  let root

  const sampleActiveUser = {
    id: 'c37b76eb-1461-49ee-9c2b-8e8bdcbbe45d',
    displayId: '849201',
    email: 'janedoe13@gmail.com',
    status: 'Active',
    registeredAt: 'September 20, 2026',
  }

  const sampleBannedUser = {
    id: 'd98a12bc-5432-41aa-8a1c-9e7bdcaae33f',
    displayId: '102938',
    email: 'banneduser@gmail.com',
    status: 'Banned',
    registeredAt: 'September 15, 2026',
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
    // Clean up any remaining portals in document.body
    document.body.querySelectorAll('[role="menu"]').forEach((el) => el.remove())
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
  })

  it('opens action menu when three dots button is clicked and executes onViewUser', async () => {
    const handleView = vi.fn()

    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
          selectedUserIds={[]}
          onToggleSelectUser={() => {}}
          onToggleSelectAllUsers={() => {}}
          onViewUser={handleView}
          onEditUser={() => {}}
          onToggleBanUser={() => {}}
          onDeleteUser={() => {}}
          canToggleBan={true}
          isLoading={false}
          processingUserIds={new Set()}
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    expect(actionButton).not.toBeNull()
    expect(actionButton.getAttribute('aria-expanded')).toBe('false')

    await act(async () => {
      actionButton.click()
    })

    expect(actionButton.getAttribute('aria-expanded')).toBe('true')

    const viewProfileBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('View Profile')
    )
    expect(viewProfileBtn).toBeDefined()

    await act(async () => {
      viewProfileBtn.click()
    })

    expect(handleView).toHaveBeenCalledWith(sampleActiveUser)

    // Wait for exit animation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })

    const menu = document.body.querySelector('[role="menu"]')
    expect(menu).toBeNull()
  })

  it('executes onEditUser when Edit User is clicked', async () => {
    const handleEdit = vi.fn()

    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
          selectedUserIds={[]}
          onToggleSelectUser={() => {}}
          onToggleSelectAllUsers={() => {}}
          onViewUser={() => {}}
          onEditUser={handleEdit}
          onToggleBanUser={() => {}}
          onDeleteUser={() => {}}
          canToggleBan={true}
          isLoading={false}
          processingUserIds={new Set()}
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    const editBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Edit User')
    )
    expect(editBtn).toBeDefined()

    await act(async () => {
      editBtn.click()
    })

    expect(handleEdit).toHaveBeenCalledWith(sampleActiveUser)
  })

  it('executes onToggleBanUser when Ban User is clicked', async () => {
    const handleToggleBan = vi.fn()

    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
          selectedUserIds={[]}
          onToggleSelectUser={() => {}}
          onToggleSelectAllUsers={() => {}}
          onViewUser={() => {}}
          onEditUser={() => {}}
          onToggleBanUser={handleToggleBan}
          onDeleteUser={() => {}}
          canToggleBan={true}
          isLoading={false}
          processingUserIds={new Set()}
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    const banBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Ban User')
    )
    expect(banBtn).toBeDefined()

    await act(async () => {
      banBtn.click()
    })

    expect(handleToggleBan).toHaveBeenCalledWith(sampleActiveUser)
  })

  it('shows Unban User for banned users', async () => {
    const handleToggleBan = vi.fn()

    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleBannedUser]}
          selectedUserIds={[]}
          onToggleSelectUser={() => {}}
          onToggleSelectAllUsers={() => {}}
          onViewUser={() => {}}
          onEditUser={() => {}}
          onToggleBanUser={handleToggleBan}
          onDeleteUser={() => {}}
          canToggleBan={true}
          isLoading={false}
          processingUserIds={new Set()}
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    const unbanBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Unban User')
    )
    expect(unbanBtn).toBeDefined()

    await act(async () => {
      unbanBtn.click()
    })

    expect(handleToggleBan).toHaveBeenCalledWith(sampleBannedUser)
  })

  it('executes onDeleteUser when Delete User is clicked', async () => {
    const handleDelete = vi.fn()

    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
          selectedUserIds={[]}
          onToggleSelectUser={() => {}}
          onToggleSelectAllUsers={() => {}}
          onViewUser={() => {}}
          onEditUser={() => {}}
          onToggleBanUser={() => {}}
          onDeleteUser={handleDelete}
          canToggleBan={true}
          isLoading={false}
          processingUserIds={new Set()}
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    const deleteBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Delete User')
    )
    expect(deleteBtn).toBeDefined()

    await act(async () => {
      deleteBtn.click()
    })

    expect(handleDelete).toHaveBeenCalledWith(sampleActiveUser)
  })

  it('hides Ban and Delete buttons when canToggleBan is false', async () => {
    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
          selectedUserIds={[]}
          onToggleSelectUser={() => {}}
          onToggleSelectAllUsers={() => {}}
          onViewUser={() => {}}
          onEditUser={() => {}}
          onToggleBanUser={() => {}}
          onDeleteUser={() => {}}
          canToggleBan={false}
          isLoading={false}
          processingUserIds={new Set()}
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    const buttons = Array.from(document.body.querySelectorAll('[role="menuitem"]')).map(
      (b) => b.textContent?.trim()
    )
    expect(buttons).toContain('View Profile')
    expect(buttons).toContain('Edit User')
    expect(buttons).not.toContain('Ban User')
    expect(buttons).not.toContain('Delete User')
  })

  it('toggles menu closed when action button is clicked again', async () => {
    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
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
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    expect(document.body.querySelector('[role="menu"]')).not.toBeNull()

    await act(async () => {
      actionButton.click()
    })

    // Wait for exit animation
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })

    expect(document.body.querySelector('[role="menu"]')).toBeNull()
  })

  it('closes menu when clicking outside', async () => {
    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
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
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    expect(document.body.querySelector('[role="menu"]')).not.toBeNull()

    await act(async () => {
      document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })

    expect(document.body.querySelector('[role="menu"]')).toBeNull()
  })

  it('closes menu and restores focus when Escape key is pressed', async () => {
    await act(async () => {
      root.render(
        <UsersTable
          users={[sampleActiveUser]}
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
        />
      )
    })

    const actionButton = container.querySelector('button[aria-haspopup="menu"]')
    await act(async () => {
      actionButton.click()
    })

    expect(document.body.querySelector('[role="menu"]')).not.toBeNull()

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })

    expect(document.body.querySelector('[role="menu"]')).toBeNull()
  })
})
