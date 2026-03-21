import { FiCheckCircle, FiClock } from "react-icons/fi";
import { formatDateTime } from "../../models/data";

export function NotificationItem({ notification, onToggleRead }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {!notification.read && (
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            )}
            <p className="text-sm font-semibold text-slate-800">
              {notification.title}
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-500">
              {notification.type}
            </span>
          </div>
          <p className="text-sm text-slate-600">{notification.message}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 font-numeric">
            <FiClock />
            {formatDateTime(notification.createdAt)}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
          onClick={() => onToggleRead(notification.id)}
        >
          <FiCheckCircle />
          {notification.read ? "Mark unread" : "Mark read"}
        </button>
      </div>
    </article>
  );
}
