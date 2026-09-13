import { FiLogOut } from 'react-icons/fi'

export function Logout({ onConfirmLogout, onCancel }) {
	return (
		<main className="w-full flex-1 min-w-0 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900">
			<section className="mx-auto mt-8 max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
				<div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
					<FiLogOut className="text-xl" />
				</div>

				<h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Ready to sign out?</h1>
				<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
					You can sign in again anytime with your registered admin account.
				</p>

				<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirmLogout}
						className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
					>
						Yes, sign out
					</button>
				</div>
			</section>
		</main>
	)
}
