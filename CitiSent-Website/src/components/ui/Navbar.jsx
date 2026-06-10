import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
	FiBell,
	FiUser,
	FiBarChart,
	FiUsers,
	FiShield,
	FiFileText,
	FiSettings,
	FiLogOut,
	FiChevronDown,
	FiChevronUp,
} from 'react-icons/fi'
import CitiSentLogo from '/assets/CitiSentLogo.svg'
import { APP_PAGES } from '../../models/pageModel'
import { normalizeUserRole, USER_ROLES } from '../../models/roleAccessModel'

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
		],
	},
	{ label: 'Admin Profile', pageKey: APP_PAGES.ADMIN_PROFILE, icon: FiUser },
	{ label: 'Settings', pageKey: APP_PAGES.SETTINGS, icon: FiSettings },
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
		containerClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		dotClass: 'bg-emerald-500',
	},
	reconnecting: {
		label: 'Reconnecting',
		containerClass: 'border-amber-200 bg-amber-50 text-amber-700',
		dotClass: 'bg-amber-500',
	},
	offline: {
		label: 'Offline',
		containerClass: 'border-rose-200 bg-rose-50 text-red-900',
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

function NavOption({ item, activePage, onNavigate, expanded }) {
	const hasChildren = Boolean(item.children?.length)
	const isReportsSection = activePage.startsWith(`${APP_PAGES.REPORTS}:`)
	const isSelected = hasChildren ? isReportsSection : activePage === item.pageKey
	const Icon = item.icon
	const [submenuOpen, setSubmenuOpen] = useState(hasChildren && isReportsSection)

	function handleClick() {
		if (hasChildren) {
			if (!isReportsSection) {
				onNavigate(APP_PAGES.REPORTS_BY_CATEGORY)
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
				className={`relative flex h-11 w-full items-center rounded-lg px-2 transition-colors ${
					isSelected
						? 'bg-blue-900/40 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]'
						: item.danger
							? 'text-rose-200 hover:bg-rose-900/30 hover:text-rose-100'
							: 'text-slate-100/90 hover:bg-blue-900/30 hover:text-white'
				}`}
			>
				<MotionDiv className="grid h-full w-10 place-content-center text-lg">
					<Icon />
				</MotionDiv>

			{expanded && (
				<span className="text-sm font-medium">
					{item.label}
				</span>
			)}

			{hasChildren && expanded ? (
				<span className="ml-auto pr-1 text-cyan-100/90">
					{submenuOpen ? <FiChevronUp className="text-lg" /> : <FiChevronDown className="text-lg" />}
				</span>
			) : null}

			{item.notifications && expanded && (
				<span
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-cyan-300 px-1.5 py-0.5 text-[10px] font-semibold text-[#1f3d67] font-numeric"
				>
					{item.notifications}
				</span>
				)}
			</MotionButton>

			{hasChildren && expanded && submenuOpen ? (
				<div className="mt-1 space-y-1 border-l border-blue-200/30 pl-5">
					{item.children.map((child) => {
						const childSelected = activePage === child.pageKey

						return (
							<button
								type="button"
								key={child.pageKey}
								onClick={() => onNavigate(child.pageKey)}
								className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
									childSelected
										? 'bg-blue-900/40 text-white'
										: 'text-cyan-100/90 hover:bg-blue-900/30 hover:text-white'
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

function BrandBlock({ expanded }) {
	return (
		<div className="mb-4 border-b border-white/12 pb-4">
			<div className="flex items-center justify-between rounded-md p-1">
				<div className="flex items-center gap-3">
					<MotionDiv className="h-11 w-11 shrink-0">
						<CitiSentLogoIcon className="h-full w-full" />
					</MotionDiv>

					{expanded && (
					<div>
						<span className="block text-sm font-semibold tracking-wide text-cyan-100">CitiSent</span>
						<span className="block text-xs text-cyan-100/70">Admin Workspace</span>
					</div>
					)}
				</div>
			</div>
		</div>
	)
}

function ConnectionStatusBadge({ status = 'connected' }) {
	const ui = CONNECTION_STATUS_UI[status] || CONNECTION_STATUS_UI.connected

	return (
		<div
			className={`hidden md:inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${ui.containerClass}`}
			aria-live="polite"
		>
			<span className={`h-2 w-2 rounded-full ${ui.dotClass}`} />
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
	connectionStatus = 'connected',
}) {
	const [mobileOpen, setMobileOpen] = useState(false)
	const [expanded, setExpanded] = useState(true)
	const resolvedRole = normalizeUserRole(profileRole)

	const visibleNavItems = navItems.filter((item) => {
		if (!item.roles) {
			return true
		}

		return item.roles.includes(resolvedRole)
	})

	function handleNavigate(nextPage) {
		onNavigate(nextPage)
		setMobileOpen(false)
	}

	return (
		<div className="flex min-h-screen bg-[#eef2f8] text-slate-900">
			<AnimatePresence>
				{mobileOpen && (
					<MotionButton
						type="button"
						className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] pointer-events-auto lg:hidden"
						onClick={() => setMobileOpen(false)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						aria-label="Close navigation menu"
					/>
				)}
			</AnimatePresence>

			<MotionAside
				className={`fixed left-0 top-0 z-40 h-full bg-[#2f4f80] text-white shadow-2xl transition-[width,transform] duration-300 ease-in-out will-change-transform lg:translate-x-0 ${expanded ? SIDEBAR_WIDTH_CLASSES.expanded : SIDEBAR_WIDTH_CLASSES.collapsed} ${mobileOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none lg:pointer-events-auto'}`}
			>
				<div className={`flex h-full flex-col pb-20 pt-5 ${expanded ? 'px-4' : 'px-2'}`}>
					<BrandBlock expanded={expanded} />

					<nav className="flex-1 space-y-2">
						{visibleNavItems.map((item) => (
							<NavOption
								key={item.label}
								item={item}
								activePage={activePage}
								onNavigate={handleNavigate}
								expanded={expanded}
							/>
						))}
					</nav>

					<MotionButton
						type="button"
						onClick={() => setExpanded((prev) => !prev)}
						className="absolute bottom-0 left-0 right-0 border-t border-white/12 bg-[#2f4f80] transition-colors hover:bg-[#3b5f97]"
					>
						<div className={`flex items-center py-2 ${expanded ? 'px-3' : 'px-2'}`}>
							<MotionDiv className="grid h-10 w-10 place-content-center text-lg text-cyan-100">
								<span>{'>>'}</span>
							</MotionDiv>
							{expanded && (
							<span className="text-sm font-medium text-cyan-100">
								Hide
							</span>
							)}
						</div>
					</MotionButton>
				</div>
			</MotionAside>

			<div
				className={`min-w-0 flex-1 overflow-x-hidden transition-none lg:transition-[margin] lg:duration-300 ease-in-out ${
					expanded ? CONTENT_OFFSET_CLASSES.expanded : CONTENT_OFFSET_CLASSES.collapsed
				}`}
			>
				<header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
					<div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<button
								type="button"
								className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 lg:hidden"
								onClick={() => setMobileOpen((prev) => !prev)}
								aria-label="Open navigation menu"
							>
								<span className="space-y-1">
									<span className="block h-0.5 w-4 bg-slate-700" />
									<span className="block h-0.5 w-4 bg-slate-700" />
									<span className="block h-0.5 w-4 bg-slate-700" />
								</span>
							</button>
						</div>

						<div className="flex items-center gap-3">
							<ConnectionStatusBadge status={connectionStatus} />
							<button
								type="button"
								onClick={() => handleNavigate(APP_PAGES.NOTIFICATIONS)}
								className={`relative grid h-9 w-9 place-items-center rounded-full border bg-white transition ${
									activePage === APP_PAGES.NOTIFICATIONS
										? 'border-blue-800 bg-blue-50 text-blue-900'
										: 'border-slate-400 text-slate-600 hover:border-blue-300 hover:bg-blue-200 transition duration-300'
								}`}
								aria-label="Notifications"
							>
								<FiBell className="text-base" />
								{unreadNotifications > 0 ? (
									<span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white font-numeric">
										{unreadNotifications}
									</span>
								) : null}
							</button>
							<button
								type="button"
								onClick={() => handleNavigate(APP_PAGES.ADMIN_PROFILE)}
								className={`grid h-10 w-10 place-items-center rounded-full border transition ${
									activePage === APP_PAGES.ADMIN_PROFILE
										? 'border-blue-700 bg-blue-100 text-blue-900'
										: 'border-slate-400 text-slate-900 hover:border-blue-300 hover:bg-blue-200'
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
		</div>
	)
}
