import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
	FiBell,
	FiUser,
	FiBarChart,
	FiUsers,
	FiFileText,
	FiSettings,
	FiLogOut,
	FiChevronDown,
	FiChevronUp,
	FiSearch,
} from 'react-icons/fi'
import CitiSentLogo from '../assets/CitiSentLogo.svg'

const navItems = [
	{ label: 'Dashboard', pageKey: 'Dashboard', icon: FiBarChart },
	{ label: 'Users', pageKey: 'Users', icon: FiUsers },
	{
		label: 'Reports',
		icon: FiFileText,
		children: [
			{ label: 'By Category', pageKey: 'Reports:By Category' },
			{ label: 'By Urgency Levels', pageKey: 'Reports:By Urgency Levels' },
		],
	},
	{ label: 'Admin Profile', pageKey: 'Admin Profile', icon: FiUser },
	{ label: 'Settings', pageKey: 'Settings', icon: FiSettings },
	{ label: 'Logout', pageKey: 'Logout', icon: FiLogOut, danger: true },
]

const MotionNav = motion.nav
const MotionAside = motion.aside
const MotionButton = motion.button
const MotionDiv = motion.div
const MotionSpan = motion.span
const MotionSection = motion.section

function CitiSentLogoIcon({ className = '' }) {
	return <img src={CitiSentLogo} alt="CitiSent logo" className={className} />
}

function NavOption({ item, activePage, onNavigate, expanded, index }) {
	const hasChildren = Boolean(item.children?.length)
	const isReportsSection = activePage.startsWith('Reports:')
	const isSelected = hasChildren ? isReportsSection : activePage === item.pageKey
	const Icon = item.icon
	const [submenuOpen, setSubmenuOpen] = useState(hasChildren && isReportsSection)

	function handleClick() {
		if (hasChildren) {
			if (!isReportsSection) {
				onNavigate('Reports:By Category')
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
						? 'bg-white/14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]'
						: item.danger
							? 'text-rose-300 hover:bg-white/8 hover:text-rose-200'
							: 'text-slate-100/90 hover:bg-white/8 hover:text-white'
				}`}
				initial={{ opacity: 0, x: -12 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: 0.05 * index, duration: 0.26 }}
			>
				<MotionDiv className="grid h-full w-10 place-content-center text-lg">
					<Icon />
				</MotionDiv>

				{expanded && (
					<MotionSpan
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="text-sm font-medium"
					>
						{item.label}
					</MotionSpan>
				)}

				{hasChildren && expanded ? (
					<span className="ml-auto pr-1 text-cyan-100/90">
						{submenuOpen ? <FiChevronUp className="text-lg" /> : <FiChevronDown className="text-lg" />}
					</span>
				) : null}

				{item.notifications && expanded && (
					<MotionSpan
						initial={{ scale: 0.5, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.2 }}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-cyan-300 px-1.5 py-0.5 text-[10px] font-semibold text-[#1f3d67]"
					>
						{item.notifications}
					</MotionSpan>
				)}
			</MotionButton>

			{hasChildren && expanded && submenuOpen ? (
				<div className="mt-1 space-y-1 border-l border-cyan-100/25 pl-5">
					{item.children.map((child) => {
						const childSelected = activePage === child.pageKey

						return (
							<button
								type="button"
								key={child.pageKey}
								onClick={() => onNavigate(child.pageKey)}
								className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
									childSelected
										? 'bg-white/14 text-white'
										: 'text-cyan-100/90 hover:bg-white/8 hover:text-white'
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
						<MotionDiv
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
						>
							<span className="block text-sm font-semibold tracking-wide text-cyan-100">CitiSent</span>
							<span className="block text-xs text-cyan-100/70">Admin Workspace</span>
						</MotionDiv>
					)}
				</div>
			</div>
		</div>
	)
}

export function Navbar({ children, activePage, onNavigate, unreadNotifications = 0 }) {
	const [mobileOpen, setMobileOpen] = useState(false)
	const [expanded, setExpanded] = useState(true)

	return (
		<div
			className="flex min-h-screen bg-[#eef2f8] text-slate-900"
			style={{ fontFamily: 'Sora, Montserrat, ui-sans-serif, system-ui' }}
		>
			<AnimatePresence>
				{mobileOpen && (
					<MotionButton
						type="button"
						className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
						onClick={() => setMobileOpen(false)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						aria-label="Close navigation menu"
					/>
				)}
			</AnimatePresence>

			<MotionAside
				className={`fixed left-0 top-0 z-40 h-full bg-[#2f4f80] text-white shadow-2xl transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 ${expanded ? 'w-68' : 'w-22'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
				initial={{ x: -28, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				transition={{ duration: 0.28, ease: 'easeOut' }}
			>
				<div
					className={`flex h-full flex-col pb-20 pt-5 ${expanded ? 'px-4' : 'px-2'}`}
					onMouseLeave={() => setMobileOpen(false)}
				>
					<BrandBlock expanded={expanded} />

					<nav className="flex-1 space-y-2">
						{navItems.map((item, index) => (
							<NavOption
								key={item.label}
								item={item}
								activePage={activePage}
								onNavigate={onNavigate}
								expanded={expanded}
								index={index}
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
								<span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>{'>>'}</span>
							</MotionDiv>
							{expanded && (
								<MotionSpan
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
									className="text-sm font-medium text-cyan-100"
								>
									Hide
								</MotionSpan>
							)}
						</div>
					</MotionButton>
				</div>
			</MotionAside>

			<div
				className={`flex-1 transition-[margin] duration-300 ease-in-out ${
					expanded ? 'lg:ml-68' : 'lg:ml-22'
				}`}
			>
				<header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
					<div className="mx-auto flex max-w-350 items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<button
								type="button"
								className="grid h-10 w-10 place-items-center rounded-lg border border-blue-900 bg-blue-900 text-white hover:bg-blue-800 lg:hidden"
								onClick={() => setMobileOpen((prev) => !prev)}
								aria-label="Open navigation menu"
							>
								<span className="space-y-1">
									<span className="block h-0.5 w-4 bg-white" />
									<span className="block h-0.5 w-4 bg-white" />
									<span className="block h-0.5 w-4 bg-white" />
								</span>
							</button>

							<label className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex md:min-w-75">
								<FiSearch className="mr-2 text-slate-400" />
								<input
									type="text"
									placeholder="Search"
									className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
								/>
							</label>
						</div>

						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => onNavigate('Notifications')}
								className={`relative grid h-9 w-9 place-items-center rounded-full border transition ${
									activePage === 'Notifications'
										? 'border-blue-900 bg-blue-900 text-white'
										: 'border-blue-900 bg-white text-blue-900 hover:bg-blue-50'
								}`}
								aria-label="Notifications"
							>
								<FiBell className="text-base" />
								{unreadNotifications > 0 ? (
									<span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
										{unreadNotifications}
									</span>
								) : null}
							</button>
							<button
								type="button"
								onClick={() => onNavigate('Admin Profile')}
								className={`grid h-10 w-10 place-items-center rounded-full border transition ${
									activePage === 'Admin Profile'
										? 'border-blue-900 bg-blue-900 text-white'
										: 'border-blue-900 bg-white text-blue-900 hover:bg-blue-50'
								}`}
								aria-label="User profile"
							>
								<FiUser className="text-base" />
							</button>
						</div>
					</div>
				</header>
				{children}
			</div>
		</div>
	)
}
