import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FiMoreHorizontal } from 'react-icons/fi'
import { TableLoader } from '../ui/TableLoader'
import { UserStatusPill } from './UserStatusPill'
import { Spinner } from '../ui/Spinner'

function UserInitialsAvatar({ name }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
      {name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </div>
  )
}

function formatLocation({ barangay, city, province }) {
  const parts = [barangay, city, province].filter((value) => Boolean(value))
  return parts.length ? parts.join(', ') : 'Not available'
}

function UsersTableHeader({ allSelected, onToggleAll }) {
  return (
    <div className="grid grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr] items-center gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
        checked={allSelected}
        onChange={onToggleAll}
        aria-label="Select all users on page"
      />
      <span>User Details</span>
      <span>Location</span>
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
  onToggleBanUser,
  onDeleteUser,
  canToggleBan,
  isProcessing = false,
}) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  const updatePopoverPosition = useCallback(() => {
    const triggerElement = triggerRef.current
    if (!triggerElement || typeof window === 'undefined') return

    const triggerRect = triggerElement.getBoundingClientRect()
    const viewportPadding = 8
    const estimatedMenuHeight = 168 // height of 4 menu items + padding

    const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding
    const spaceAbove = triggerRect.top - viewportPadding
    const openAbove = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow

    const top = openAbove
      ? Math.max(viewportPadding, triggerRect.top - estimatedMenuHeight - 8)
      : triggerRect.bottom + 8

    const left = Math.max(
      viewportPadding,
      Math.min(triggerRect.right - 144, window.innerWidth - 144 - viewportPadding)
    )

    setPopoverStyle({
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: '144px',
      zIndex: 50,
    })
  }, [])

  useEffect(() => {
    if (!isActionMenuOpen) return

    updatePopoverPosition()

    function handleReposition() {
      updatePopoverPosition()
    }

    function onPointerDown(event) {
      const target = event.target
      if (!(target instanceof Element)) return
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setIsActionMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', handleReposition)
    document.addEventListener('scroll', handleReposition, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', handleReposition)
      document.removeEventListener('scroll', handleReposition, true)
    }
  }, [isActionMenuOpen, updatePopoverPosition])

  function handleAction(action) {
    if (action === 'view') onViewUser(user)
    if (action === 'edit') onEditUser(user)
    if (action === 'ban-toggle') onToggleBanUser(user)
    if (action === 'delete') onDeleteUser(user)
    setIsActionMenuOpen(false)
  }

  return (
    <div className="group grid grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr] items-center gap-3 border-b border-slate-100 px-5 py-4 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-800/50">
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
        checked={isSelected}
        onChange={() => onToggleSelected(user.id)}
        aria-label={`Select ${user.name || 'user'}`}
      />
      <div className="flex items-center gap-3">
        <UserInitialsAvatar name={user.name} />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">{formatLocation(user)}</p>
      <UserStatusPill status={user.status} />
      <p className="font-numeric text-sm text-slate-700 dark:text-slate-300">{user.registeredAt}</p>
      <div className="relative">
        <button
          type="button"
          ref={triggerRef}
          disabled={isProcessing}
          onClick={() => setIsActionMenuOpen((isOpen) => !isOpen)}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {isProcessing ? <Spinner size="sm" /> : <FiMoreHorizontal />}
        </button>

        {isActionMenuOpen && popoverStyle && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={popoverRef}
                style={popoverStyle}
                className="animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 py-1 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95"
              >
                <button
                  type="button"
                  onClick={() => handleAction('view')}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('edit')}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Edit User
                </button>
                {canToggleBan ? (
                  <button
                    type="button"
                    onClick={() => handleAction('ban-toggle')}
                    className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      user.status === 'Banned'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {user.status === 'Banned' ? 'Unban User' : 'Ban User'}
                  </button>
                ) : null}
                {canToggleBan ? (
                  <button
                    type="button"
                    onClick={() => handleAction('delete')}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    Delete User
                  </button>
                ) : null}
              </div>,
              document.body
            )
          : null}
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
  onToggleBanUser,
  onDeleteUser,
  canToggleBan = false,
  isLoading = false,
  processingUserIds = new Set(),
}) {
  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds])
  const allSelected = users.length > 0 && users.every((user) => selectedSet.has(user.id))
  
  const isInitialLoading = isLoading && users.length === 0
  const isRefreshing = isLoading && users.length > 0

  return (
    <div className="overflow-x-auto">
      <div className="min-w-170">
        <UsersTableHeader allSelected={allSelected} onToggleAll={onToggleSelectAllUsers} />

        <div className="divide-y divide-slate-200">
          <TableLoader
            isLoading={isRefreshing}
            delayMs={0}
            layout="users-grid"
            variant="refreshing"
            label="Refreshing users..."
            refreshText="Refreshing users..."
            rows={1}
            gridTemplateColumnsClass="grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr]"
            className="bg-transparent dark:text-slate-400"
          />

          <TableLoader
            isLoading={isInitialLoading}
            delayMs={0}
            minDisplayMs={0}
            layout="users-grid"
            variant="skeleton"
            label="Loading users..."
            rows={5}
            gridTemplateColumnsClass="grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr]"
            className="bg-transparent dark:text-slate-400"
          />

          {!isInitialLoading && (users.length > 0 ? (
            users.map((user) => (
              <UsersTableRow
                key={user.id}
                user={user}
                isSelected={selectedSet.has(user.id)}
                onToggleSelected={onToggleSelectUser}
                onViewUser={onViewUser}
                onEditUser={onEditUser}
                onToggleBanUser={onToggleBanUser}
                onDeleteUser={onDeleteUser}
                canToggleBan={canToggleBan}
                isProcessing={processingUserIds.has(user.id)}
              />
            ))
          ) : (
            <div className="px-4 py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">No users found.</div>
          ))}
        </div>
      </div>
    </div>
  )
}
