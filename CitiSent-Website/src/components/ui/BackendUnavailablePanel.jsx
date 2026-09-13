export function BackendUnavailablePanel({
  title = 'Backend temporarily unavailable',
  message = 'The API server cannot be reached right now.',
  onRetry,
  onSignOut,
}) {
  return (
    <main className="w-full flex-1 min-w-0 bg-[#eef2f8] px-4 py-8 md:px-6 lg:px-8 dark:bg-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Service disruption
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <p className="mt-2 text-sm text-slate-500">
          You can try reconnecting now, or sign out and sign in again later.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Retry connection
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  )
}
