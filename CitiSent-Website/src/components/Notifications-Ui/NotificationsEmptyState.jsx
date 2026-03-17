import { FiBell } from "react-icons/fi";

export function NotificationsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center shadow-sm">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-600">
        <FiBell />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">
        No notifications found
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        You are all caught up for this filter.
      </p>
    </div>
  );
}
