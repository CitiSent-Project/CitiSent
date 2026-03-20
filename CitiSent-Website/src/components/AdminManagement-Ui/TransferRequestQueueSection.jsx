export function TransferRequestQueueSection({
  filteredPendingRequests,
  unreadByAdminId,
  onOpenApprovalModal,
  onOpenRejectionModal,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{request.adminName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    {request.status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      unreadByAdminId[request.adminId] > 0
                        ? 'bg-cyan-100 text-cyan-800'
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
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenApprovalModal(request)}
                  className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition theme-dark-btn-primary"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRejectionModal(request)}
                  className="rounded-lg border border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-500 hover:text-white hover:border-white transition theme-dark-btn-outline"
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
