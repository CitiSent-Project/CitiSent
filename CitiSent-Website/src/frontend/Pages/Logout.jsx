import { FiLogOut } from 'react-icons/fi'

export function Logout({ onConfirmLogout, onCancel }) {
	return (
		<main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
			<section className="mx-auto mt-8 max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
				<div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
					<FiLogOut className="text-xl" />
				</div>

				<h1 className="mt-4 text-2xl font-semibold text-slate-900">Ready to sign out?</h1>
				<p className="mt-2 text-sm text-slate-600">
					You can sign in again anytime with your registered admin account.
				</p>

				<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
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
