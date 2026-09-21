import React from "react";
import { IoCheckmarkCircle, IoAlertCircle, IoInformationCircle, IoClose } from "react-icons/io5";

export function Toast({ type = "info", message, onClose }) {
  if (!message) return null;

  const typeConfig = {
    success: {
      icon: <IoCheckmarkCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
      bg: "bg-emerald-950/80 border-emerald-800 text-emerald-200",
    },
    error: {
      icon: <IoAlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      bg: "bg-rose-950/80 border-rose-800 text-rose-200",
    },
    info: {
      icon: <IoInformationCircle className="w-5 h-5 text-cyan-400 shrink-0" />,
      bg: "bg-cyan-950/80 border-cyan-800 text-cyan-200",
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all ${config.bg} mb-4`}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-colors"
        >
          <IoClose className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
