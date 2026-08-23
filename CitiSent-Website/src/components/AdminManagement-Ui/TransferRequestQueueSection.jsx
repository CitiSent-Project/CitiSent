import { FiArrowRight, FiCheckCircle, FiXCircle } from 'react-icons/fi'

export function TransferRequestQueueSection({
  filteredPendingRequests,
  unreadByAdminId,
  onOpenApprovalModal,
  onOpenRejectionModal,
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all sm:p-6">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">Transfer Request Queue</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Review and process pending department transfer requests from office admins.
      </p>

      {filteredPendingRequests.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-8 text-center">
          <p className="text-xs font-medium text-slate-500">
            No pending transfer requests match your current filters.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filteredPendingRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition hover:border-slate-300">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-slate-900">{request.adminName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/80">
                    {request.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      unreadByAdminId[request.adminId] > 0
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {unreadByAdminId[request.adminId] || 0} unread for requester
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-700">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 border border-slate-200/60">
                  {request.currentDepartmentLabel}
                </span>
                <FiArrowRight className="text-slate-400 text-xs shrink-0" />
                <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700 border border-blue-200/60">
                  {request.requestedDepartmentLabel}
                </span>
              </div>
              {request.reason ? (
                <p className="mt-2.5 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Reason: </span>
                  {request.reason}
                </p>
              ) : null}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenApprovalModal(request)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] shadow-xs shadow-emerald-500/20 cursor-pointer"
                >
                  <FiCheckCircle className="text-xs" />
                  <span>Approve Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRejectionModal(request)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 active:scale-[0.98] cursor-pointer"
                >
                  <FiXCircle className="text-xs" />
                  <span>Reject Request</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

