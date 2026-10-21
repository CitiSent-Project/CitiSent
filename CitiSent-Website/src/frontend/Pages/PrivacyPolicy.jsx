import React from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import CitiSentLogo from '/assets/CitiSentLogo.svg'
import { PrivacyTermsSettingsTab } from '../../components/Settings-Ui'

export function PrivacyPolicy() {
  function handleGoHome() {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Public Top Header Bar */}
        <header className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src={CitiSentLogo} alt="CitiSent logo" className="h-9 w-9" />
            <div>
              <span className="block text-base font-bold tracking-tight text-slate-900 dark:text-white">
                CitiSent
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Civic Governance & Privacy Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <FiArrowLeft className="text-sm" />
            Back to Portal
          </button>
        </header>

        {/* Embedded Modern Governance Hub */}
        <PrivacyTermsSettingsTab />
      </div>
    </div>
  )
}
