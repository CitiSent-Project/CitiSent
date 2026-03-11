import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
	FiBell,
	FiUser,
	FiBarChart,
	FiUsers,
	FiFileText,
	FiMessageSquare,
	FiSettings,
	FiLogOut,
} from 'react-icons/fi'
import CitiSentLogo from '../assets/CitiSentLogo.svg'

const navItems = [
	{ label: 'Dashboard', icon: FiBarChart },
	{ label: 'Users', icon: FiUsers },
	{ label: 'Reports', icon: FiFileText },
	{ label: 'Update News', icon: FiMessageSquare },
	{ label: 'Settings', icon: FiSettings },
	{ label: 'Logout', icon: FiLogOut, danger: true },
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

function NavOption({ item, selected, setSelected, expanded, index }) {
	const isSelected = selected === item.label
	const Icon = item.icon

	return (
		<MotionButton
			type="button"
			onClick={() => setSelected(item.label)}
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

export function Navbar({ children }) {
	const [mobileOpen, setMobileOpen] = useState(false)
	const [expanded, setExpanded] = useState(true)
	const [selected, setSelected] = useState('Dashboard')

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
								selected={selected}
								setSelected={setSelected}
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
								className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
								onClick={() => setMobileOpen((prev) => !prev)}
								aria-label="Open navigation menu"
							>
								<span className="space-y-1">
									<span className="block h-0.5 w-4 bg-slate-700" />
									<span className="block h-0.5 w-4 bg-slate-700" />
									<span className="block h-0.5 w-4 bg-slate-700" />
								</span>
							</button>

							<label className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex md:min-w-75">
								<span className="mr-2 text-xs uppercase tracking-wider text-slate-400">Search</span>
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
								className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500"
								aria-label="Notifications"
							>
								<FiBell className="text-base" />
							</button>
							<button
								type="button"
								className="grid h-10 w-10 place-items-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700"
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
