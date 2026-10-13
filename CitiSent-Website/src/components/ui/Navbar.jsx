import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
	FiBell,
	FiUser,
	FiBarChart,
	FiUsers,
	FiShield,
	FiFileText,
	FiMessageCircle,
	FiSettings,
	FiLogOut,
	FiChevronDown,
	FiChevronUp,
	FiX,
} from 'react-icons/fi'
import CitiSentLogo from '/assets/CitiSentLogo.svg'
import { APP_PAGES } from '../../models/pageModel'
import { normalizeUserRole, USER_ROLES } from '../../models/roleAccessModel'
import { NotificationsDrawer } from '../Notifications-Ui/NotificationsDrawer'

const navItems = [
	{ label: 'Dashboard', pageKey: APP_PAGES.DASHBOARD, icon: FiBarChart },
	{
		label: 'Admin Management',
		pageKey: APP_PAGES.ADMIN_MANAGEMENT,
		icon: FiShield,
		roles: [USER_ROLES.SUPERADMIN],
	},
	{
		label: 'Users',
		pageKey: APP_PAGES.USERS,
		icon: FiUsers,
		roles: [USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN],
	},
	{
		label: 'Reports',
		icon: FiFileText,
		roles: [USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN],
		children: [
			{ label: 'By Category', pageKey: APP_PAGES.REPORTS_BY_CATEGORY },
			{ label: 'By Urgency Levels', pageKey: APP_PAGES.REPORTS_BY_URGENCY },
			{ label: 'History', pageKey: APP_PAGES.REPORTS_HISTORY },
		],
	},
	{
		label: 'Conversations',
		pageKey: APP_PAGES.CONVERSATIONS,
		icon: FiMessageCircle,
		roles: [USER_ROLES.SUPERADMIN, USER_ROLES.OFFICE_ADMIN],
	},
	{ label: 'Admin Profile', pageKey: APP_PAGES.ADMIN_PROFILE, icon: FiUser },
	{
		label: 'Settings',
		pageKey: APP_PAGES.SETTINGS,
		icon: FiSettings,
		children: [
			{ label: 'Appearance', pageKey: APP_PAGES.SETTINGS_APPEARANCE },
			{ label: 'Security', pageKey: APP_PAGES.SETTINGS_SECURITY },
			{ label: 'Notifications', pageKey: APP_PAGES.SETTINGS_NOTIFICATIONS },
			{ label: 'Report Management', pageKey: APP_PAGES.SETTINGS_REPORT_MANAGEMENT },
			{ label: 'Audit & Logs', pageKey: APP_PAGES.SETTINGS_AUDIT_LOGS },
			{ label: 'System', pageKey: APP_PAGES.SETTINGS_SYSTEM },
		],
	},
	{ label: 'Logout', pageKey: APP_PAGES.LOGOUT, icon: FiLogOut, danger: true },
]

const SIDEBAR_WIDTH_CLASSES = {
	expanded: 'w-60',
	collapsed: 'w-[4.5rem]',
}

const CONTENT_OFFSET_CLASSES = {
	expanded: 'lg:ml-60',
	collapsed: 'lg:ml-[4.5rem]',
}

const CONNECTION_STATUS_UI = {
	connected: {
		label: 'Connected',
		containerClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
		dotClass: 'bg-emerald-500',
	},
	reconnecting: {
		label: 'Reconnecting',
		containerClass: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
		dotClass: 'bg-amber-500',
	},
	offline: {
		label: 'Offline',
		containerClass: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
		dotClass: 'bg-rose-500',
	},
}

const MotionAside = motion.aside
const MotionButton = motion.button
const MotionDiv = motion.div
const MotionSpan = motion.span

const MainContentSlot = memo(function MainContentSlot({ children }) {
	return children
})

function CitiSentLogoIcon({ className = '' }) {
	return <img src={CitiSentLogo} alt="CitiSent logo" className={className} />
}

function NavOption({ item, activePage, onNavigate, isDesktopExpanded }) {
	const hasChildren = Boolean(item.children?.length)
	const isChildActive = Boolean(item.children?.some((child) => child.pageKey === activePage))
	const isSectionActive =
		activePage === item.pageKey ||
		(item.pageKey && activePage.startsWith(`${item.pageKey}:`)) ||
		isChildActive
	const isSelected = hasChildren ? isSectionActive : activePage === item.pageKey
	const Icon = item.icon
	const [submenuOpen, setSubmenuOpen] = useState(hasChildren && isSectionActive)

	useEffect(() => {
		if (hasChildren && isSectionActive) {
			setSubmenuOpen(true)
		}
	}, [hasChildren, isSectionActive])

	function handleClick() {
		if (hasChildren) {
			if (!isSectionActive) {
				const defaultChild = item.children[0]?.pageKey || item.pageKey
				onNavigate(defaultChild)
				setSubmenuOpen(true)
				return
			}

			setSubmenuOpen((previousValue) => !previousValue)
			return
		}

		onNavigate(item.pageKey)
	}

	return (
		<div>
			<MotionButton
				type="button"
				onClick={handleClick}
				className={`relative flex h-10 w-full items-center rounded-md px-2.5 transition-colors cursor-pointer ${
					isSelected
						? 'bg-blue-600/15 text-white font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-blue-600'
						: item.danger
							? 'text-rose-300 hover:bg-rose-950/30 hover:text-rose-200'
							: 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
				}`}
			>
				<MotionDiv className="grid h-full w-8 place-content-center text-base shrink-0">
					<Icon />
				</MotionDiv>

				<span className={`text-sm pl-1.5 truncate ${isDesktopExpanded ? 'block' : 'block lg:hidden'}`}>
					{item.label}
				</span>

				{hasChildren ? (
					<span className={`ml-auto pr-1 text-slate-400 ${isDesktopExpanded ? 'block' : 'block lg:hidden'}`}>
						{submenuOpen ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}
					</span>
				) : null}

				{item.notifications ? (
					<span
						className={`rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white font-numeric ${
							isDesktopExpanded
								? 'ml-auto'
								: 'ml-auto lg:absolute lg:right-2 lg:top-1/2 lg:-translate-y-1/2'
						}`}
					>
						{item.notifications}
					</span>
				) : null}
			</MotionButton>

			{hasChildren && submenuOpen ? (
				<div className={`mt-1 space-y-1 border-l border-slate-800 ml-4 pl-3 ${isDesktopExpanded ? 'block' : 'block lg:hidden'}`}>
					{item.children.map((child) => {
						const childSelected = activePage === child.pageKey

						return (
							<button
								type="button"
								key={child.pageKey}
								onClick={() => onNavigate(child.pageKey)}
								className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
									childSelected
										? 'bg-blue-600/15 text-white font-medium'
										: 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
								}`}
							>
								{child.label}
							</button>
						)
					})}
				</div>
			) : null}
		</div>
	)
}

function BrandBlock({ isDesktopExpanded, onCloseMobile }) {
	return (
		<div className="mb-4 border-b border-slate-800/80 pb-3">
			<div className="flex items-center justify-between rounded-md p-1">
				<div className="flex items-center gap-3 min-w-0">
					<MotionDiv className="h-9 w-9 shrink-0">
						<CitiSentLogoIcon className="h-full w-full" />
					</MotionDiv>

					<div className={isDesktopExpanded ? 'block' : 'block lg:hidden'}>
						<span className="block text-sm font-semibold tracking-tight text-white">CitiSent</span>
						<span className="block text-[11px] text-slate-400 uppercase tracking-wider">Admin Portal</span>
					</div>
				</div>

				{onCloseMobile ? (
					<button
						type="button"
						onClick={onCloseMobile}
						className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden shrink-0 cursor-pointer"
						aria-label="Close navigation menu"
					>
						<FiX className="text-lg" />
					</button>
				) : null}
			</div>
		</div>
	)
}

function ConnectionStatusBadge({ status = 'connected' }) {
	const ui = CONNECTION_STATUS_UI[status] || CONNECTION_STATUS_UI.connected

	return (
		<div
			className={`hidden md:inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${ui.containerClass}`}
			aria-live="polite"
		>
			<span className={`h-1.5 w-1.5 rounded-full ${ui.dotClass}`} />
			<span>{ui.label}</span>
		</div>
	)
}

export function Navbar({
	children,
	activePage,
	onNavigate,
	profileRole,
	unreadNotifications = 0,
	unreadChatCount = 0,
	connectionStatus = 'connected',
	// New Drawer Props
	notifications = [],
	onToggleRead,
	onClearAll,
	isClearingNotifications = false,
}) {
	const [mobileOpen, setMobileOpen] = useState(false)
	const [expanded, setExpanded] = useState(true)
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
	const resolvedRole = normalizeUserRole(profileRole)

	const visibleNavItems = navItems
		.filter((item) => {
			if (!item.roles) {
				return true
			}

			return item.roles.includes(resolvedRole)
		})
		.map((item) => {
			if (item.pageKey === APP_PAGES.CONVERSATIONS && unreadChatCount > 0) {
				return {
					...item,
					notifications: unreadChatCount > 99 ? '99+' : unreadChatCount,
				}
			}
			return item
		})

	function handleNavigate(nextPage) {
		onNavigate(nextPage)
		setMobileOpen(false)
	}

	return (
		<div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100">
			<AnimatePresence>
				{mobileOpen && (
					<MotionButton
						type="button"
						className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto lg:hidden"
						onClick={() => setMobileOpen(false)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						aria-label="Close navigation menu"
					/>
				)}
			</AnimatePresence>

			<MotionAside
				className={`fixed left-0 top-0 z-40 h-full bg-[#0c1322] text-slate-200 border-r border-slate-800 transition-[width,transform] duration-300 ease-in-out will-change-transform lg:translate-x-0 w-72 max-w-[85vw] ${
					expanded ? 'lg:w-60' : 'lg:w-18'
				} ${
					mobileOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none lg:pointer-events-auto'
				}`}
			>
				<div className={`flex h-full flex-col pb-20 pt-4 px-3.5 ${expanded ? 'lg:px-3.5' : 'lg:px-2'}`}>
					<BrandBlock isDesktopExpanded={expanded} onCloseMobile={() => setMobileOpen(false)} />

					<nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
						{visibleNavItems.map((item) => (
							<NavOption
								key={item.label}
								item={item}
								activePage={activePage}
								onNavigate={handleNavigate}
								isDesktopExpanded={expanded}
							/>
						))}
					</nav>

					<MotionButton
						type="button"
						onClick={() => setExpanded((prev) => !prev)}
						className="hidden lg:block absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-[#0c1322] transition-colors hover:bg-slate-800/60 cursor-pointer"
					>
						<div className={`flex items-center py-2.5 ${expanded ? 'px-3.5' : 'px-2'}`}>
							<MotionDiv className="grid h-8 w-8 place-content-center text-xs text-slate-400">
								<span>{expanded ? '«' : '»'}</span>
							</MotionDiv>
							{expanded && (
								<span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
									Collapse
								</span>
							)}
						</div>
					</MotionButton>
				</div>
			</MotionAside>

			<div
				className={`min-w-0 flex-1 transition-none lg:transition-[margin] lg:duration-300 ease-in-out ${
					expanded ? CONTENT_OFFSET_CLASSES.expanded : CONTENT_OFFSET_CLASSES.collapsed
				}`}
			>
				<header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-md px-4 py-2.5 md:px-6 lg:px-8">
					<div className="flex w-full items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<button
								type="button"
								className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
								onClick={() => setMobileOpen((prev) => !prev)}
								aria-label="Open navigation menu"
							>
								<span className="space-y-1">
									<span className="block h-0.5 w-4 bg-current" />
									<span className="block h-0.5 w-4 bg-current" />
									<span className="block h-0.5 w-4 bg-current" />
								</span>
							</button>
						</div>

						<div className="flex items-center gap-2.5">
							<ConnectionStatusBadge status={connectionStatus} />
							<button
								type="button"
								onClick={() => setIsNotificationsOpen(true)}
								className={`relative grid h-9 w-9 place-items-center rounded-md border transition cursor-pointer ${
									isNotificationsOpen
										? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
										: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
								}`}
								aria-label="Notifications"
							>
								<FiBell className="text-base" />
								{unreadNotifications > 0 ? (
									<span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white font-numeric">
										{unreadNotifications}
									</span>
								) : null}
							</button>
							<button
								type="button"
								onClick={() => handleNavigate(APP_PAGES.ADMIN_PROFILE)}
								className={`grid h-9 w-9 place-items-center rounded-md border transition cursor-pointer ${
									activePage === APP_PAGES.ADMIN_PROFILE
										? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
										: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
								}`}
								aria-label="User profile"
							>
								<FiUser className="text-base" />
							</button>
						</div>
					</div>
				</header>
				<MainContentSlot>{children}</MainContentSlot>
			</div>

			<AnimatePresence>
				{isNotificationsOpen && (
					<NotificationsDrawer
						notifications={notifications}
						onToggleRead={onToggleRead}
						onClearAll={onClearAll}
						isClearing={isClearingNotifications}
						onClose={() => setIsNotificationsOpen(false)}
                        onNavigate={(targetPage) => handleNavigate(targetPage || APP_PAGES.DASHBOARD)}
					/>
				)}
			</AnimatePresence>
		</div>
	)
}
