import { useMemo, useState } from 'react'
import { FiMoreHorizontal } from 'react-icons/fi'
import { UserStatusPill } from './UserStatusPill'

function UserInitialsAvatar({ name }) {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
      {name
        .split(' ')
        .map((part) => part[0])
        .join('')}
    </div>
  )
}

function UsersTableHeader({ allSelected, onToggleAll }) {
  return (
    <div className="grid grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr] items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300"
        checked={allSelected}
        onChange={onToggleAll}
        aria-label="Select all users on page"
      />
      <span>User Details</span>
      <span>Address</span>
      <span>Account Status</span>
      <span>Registered Date</span>
      <span>Action</span>
    </div>
  )
}

function UsersTableRow({
  user,
  isSelected,
  onToggleSelected,
  onViewUser,
  onEditUser,
  onBanUser,
}) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)

  function handleAction(action) {
    if (action === 'view') onViewUser(user)
    if (action === 'edit') onEditUser(user)
    if (action === 'ban') onBanUser(user)
    setIsActionMenuOpen(false)
  }

  return (
    <div className="grid grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr] items-center gap-3 px-4 py-3 hover:bg-slate-50">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300"
        checked={isSelected}
        onChange={() => onToggleSelected(user.id)}
        aria-label={`Select ${user.name}`}
      />
      <div className="flex items-center gap-3">
        <UserInitialsAvatar name={user.name} />
        <div>
          <p className="text-sm font-semibold text-slate-800">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      <p className="text-sm text-slate-700">{user.address}</p>
      <UserStatusPill status={user.status} />
      <p className="text-sm text-slate-700">{user.registeredAt}</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsActionMenuOpen((isOpen) => !isOpen)}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500"
        >
          <FiMoreHorizontal />
        </button>

        {isActionMenuOpen ? (
          <div className="absolute right-0 z-10 mt-2 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => handleAction('view')}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              View Profile
            </button>
            <button
              type="button"
              onClick={() => handleAction('edit')}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              Edit User
            </button>
            <button
              type="button"
              onClick={() => handleAction('ban')}
              className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              Ban User
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function UsersTable({
  users,
  selectedUserIds = [],
  onToggleSelectUser,
  onToggleSelectAllUsers,
  onViewUser,
  onEditUser,
  onBanUser,
}) {
  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds])
  const allSelected = users.length > 0 && users.every((user) => selectedSet.has(user.id))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-190">
        <UsersTableHeader allSelected={allSelected} onToggleAll={onToggleSelectAllUsers} />

        <div className="divide-y divide-slate-200">
          {users.length ? (
            users.map((user) => (
              <UsersTableRow
                key={user.id}
                user={user}
                isSelected={selectedSet.has(user.id)}
                onToggleSelected={onToggleSelectUser}
                onViewUser={onViewUser}
                onEditUser={onEditUser}
                onBanUser={onBanUser}
              />
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-500">No users found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
