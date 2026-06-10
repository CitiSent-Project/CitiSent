export function TransferRequestQueueSection({
  filteredPendingRequests,
  unreadByAdminId,
  onOpenApprovalModal,
  onOpenRejectionModal,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-slate-900">Transfer request queue</h2>
      <p className="mt-1 text-sm text-slate-600">
        Review pending transfer requests from office admins.
      </p>

      {filteredPendingRequests.length === 0 ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No pending transfer requests match your current filters.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filteredPendingRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">{request.adminName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    {request.status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      unreadByAdminId[request.adminId] > 0
                        ? 'bg-blue-100 text-cyan-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {unreadByAdminId[request.adminId] || 0} unread for requester
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {request.currentDepartmentLabel} to {request.requestedDepartmentLabel}
              </p>
              <p className="mt-2 text-sm text-slate-600">{request.reason}</p>
              <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => onOpenApprovalModal(request)}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600 sm:py-1.5 theme-dark-btn-primary"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRejectionModal(request)}
                  className="rounded-lg border border-blue-700 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-white hover:bg-blue-500 hover:text-white sm:py-1.5 theme-dark-btn-outline"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
