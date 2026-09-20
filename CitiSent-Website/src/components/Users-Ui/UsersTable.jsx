import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiMoreHorizontal } from 'react-icons/fi'
import { TableLoader } from '../ui/TableLoader'
import { UserStatusPill } from './UserStatusPill'
import { Spinner } from '../ui/Spinner'
import { getMotionVariants, tableRowVariants } from '../../utils/motionVariants'

function UserInitialsAvatar({ name }) {
  const displayString = name || '?'
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
      {displayString
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </div>
  )
}



function UsersTableHeader({ allSelected, onToggleAll }) {
  return (
    <div className="hidden lg:grid grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] items-center gap-4 border-b border-slate-200 bg-slate-50/50 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400">
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
          checked={allSelected}
          onChange={onToggleAll}
          aria-label="Select all users on page"
        />
      </div>
      <span>User Details</span>
      <span>Account Status</span>
      <span>Registered Date</span>
      <span className="flex justify-end pr-1">Action</span>
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
  prefersReduced = false,
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
    <motion.div
      layout={prefersReduced ? false : 'position'}
      variants={getMotionVariants(tableRowVariants, prefersReduced)}
      initial="initial"
      animate="animate"
      exit="exit"
      className="group relative border-b border-slate-100 px-4 py-4 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-800/50 lg:grid lg:grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] lg:items-center lg:gap-4 lg:px-5 lg:py-3.5"
    >
      {/* Checkbox — anchored to top on mobile, grid cell on desktop */}
      <div className="absolute left-4 top-4.5 lg:static lg:flex lg:items-center lg:justify-center">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
          checked={isSelected}
          onChange={() => onToggleSelected(user.id)}
          aria-label={`Select ${user.email || 'user'}`}
        />
      </div>

      {/* User Details — avatar + email/id */}
      <div className="flex min-w-0 items-center gap-3 ml-8 pr-11 lg:ml-0 lg:pr-0">
        <div className="shrink-0">
          <UserInitialsAvatar name={user.email || user.username || user.id} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.email || user.username || 'No Email'}</p>
          <p className="truncate text-xs font-numeric text-slate-500 dark:text-slate-400 lg:text-sm">ID: {user.displayId || user.id}</p>
        </div>
      </div>

      {/* Account Status */}
      <div className="mt-2.5 ml-11 lg:mt-0 lg:ml-0 flex items-center">
        <span className="lg:hidden font-semibold uppercase tracking-wider text-slate-400 mr-2 text-[11px]">Status:</span>
        <UserStatusPill status={user.status} />
      </div>

      {/* Registered Date */}
      <div className="mt-2 ml-11 lg:mt-0 lg:ml-0 lg:flex lg:items-center">
        <p className="font-numeric text-[11px] text-slate-500 dark:text-slate-400 lg:text-sm">
          <span className="lg:hidden font-semibold uppercase tracking-wider text-slate-400 mr-1">Registered:</span>
          {user.registeredAt}
        </p>
      </div>

      {/* Action button — anchored to top on mobile (top-right), flex-end in grid on desktop */}
      <div className="absolute right-4 top-4 lg:static lg:flex lg:items-center lg:justify-end">
        <motion.button
          type="button"
          ref={triggerRef}
          disabled={isProcessing}
          onClick={() => setIsActionMenuOpen((isOpen) => !isOpen)}
          whileHover={{ scale: isProcessing ? 1 : 1.06 }}
          whileTap={{ scale: isProcessing ? 1 : 0.94 }}
          className="grid h-8.5 w-8.5 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 cursor-pointer"
        >
          {isProcessing ? <Spinner size="sm" /> : <FiMoreHorizontal />}
        </motion.button>

        <AnimatePresence>
          {isActionMenuOpen && popoverStyle && typeof document !== 'undefined'
            ? createPortal(
                <motion.div
                  ref={popoverRef}
                  style={popoverStyle}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 py-1 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95"
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
              </motion.div>,
              document.body
            )
          : null}
        </AnimatePresence>
      </div>
    </motion.div>
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
  const prefersReduced = useReducedMotion()
  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds])
  const allSelected = users.length > 0 && users.every((user) => selectedSet.has(user.id))
  
  const isInitialLoading = isLoading && users.length === 0
  const isRefreshing = isLoading && users.length > 0

  return (
    <div className="overflow-x-hidden lg:overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-700/50 dark:bg-slate-800">
      <div className="min-w-full lg:min-w-175">
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
            gridTemplateColumnsClass="lg:grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_80px]"
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
            gridTemplateColumnsClass="lg:grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_80px]"
            className="bg-transparent dark:text-slate-400"
          />

          <AnimatePresence initial={false}>
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
                  prefersReduced={prefersReduced}
                />
              ))
            ) : (
              <div className="px-4 py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">No users found.</div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
