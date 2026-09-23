import React from "react";
import { IoShieldCheckmark, IoLogOutOutline, IoTerminal } from "react-icons/io5";

export function Navbar({ developerEmail, onSignOut }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white font-bold text-lg">
            <IoTerminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base">
                CitiSent<span className="text-cyan-400 font-extrabold">-Ops</span>
              </span>
              <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-cyan-500/20">
                CONTROL PLANE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Air-Gapped Platform Operations & Commissioning
            </p>
          </div>
        </div>

        {/* Developer Session Info & Logout */}
        <div className="flex items-center gap-3">
          {developerEmail && (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium hidden md:inline">
                {developerEmail}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <IoShieldCheckmark className="w-3 h-3" /> MFA Active
              </span>
            </div>
          )}

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Sign Out of Developer Portal"
            >
              <IoLogOutOutline className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
