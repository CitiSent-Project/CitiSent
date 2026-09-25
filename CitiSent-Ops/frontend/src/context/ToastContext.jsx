import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IoCheckmarkCircle,
  IoAlertCircle,
  IoInformationCircle,
  IoWarningOutline,
  IoClose,
} from "react-icons/io5";

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: <IoCheckmarkCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <IoAlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  warning: <IoWarningOutline className="w-5 h-5 text-amber-400 shrink-0" />,
  info: <IoInformationCircle className="w-5 h-5 text-cyan-400 shrink-0" />,
};

const TOAST_STYLES = {
  success: "bg-emerald-950/90 border-emerald-700/80 text-emerald-100 shadow-emerald-950/50",
  error: "bg-rose-950/90 border-rose-700/80 text-rose-100 shadow-rose-950/50",
  warning: "bg-amber-950/90 border-amber-700/80 text-amber-100 shadow-amber-950/50",
  info: "bg-cyan-950/90 border-cyan-700/80 text-cyan-100 shadow-cyan-950/50",
};

/**
 * Toast Provider Component
 *
 * Wraps the application to render real-time, animated notification banners.
 * Manages toast lifecycle, auto-dismiss timers, and accessibility.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 4500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md ${TOAST_STYLES[toast.type] || TOAST_STYLES.info
                }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">{TOAST_ICONS[toast.type] || TOAST_ICONS.info}</div>
                <div className="min-w-0">
                  {toast.title && (
                    <div className="text-xs font-bold leading-tight mb-0.5">
                      {toast.title}
                    </div>
                  )}
                  <div className="text-xs font-medium leading-snug wrap-break-word opacity-90">
                    {toast.message}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-md hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <IoClose className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Custom hook to trigger toasts from any component in the app.
 *
 * Usage:
 * ```js
 * const { showToast } = useToast();
 * showToast({ type: "success", title: "Saved", message: "Superadmin created!" });
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
