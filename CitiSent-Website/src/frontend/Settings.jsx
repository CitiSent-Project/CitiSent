import { useState } from 'react'
import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_PREFERENCES,
  DEPARTMENT_OPTIONS,
} from '../models/data'
import { usePersistToStorage } from '../hooks/usePersistToStorage'
import { loadFromStorage } from '../services/storageService'
import {
  AccountSettingsTab,
  AppearanceSettingsTab,
  DepartmentTransferTab,
  NotificationSettingsTab,
  SecuritySettingsTab,
  SettingsTabNav,
} from '../components/Settings-Ui'

const tabs = ['Account', 'Notifications', 'Appearance', 'Security', 'Transfers']

export function Settings({
  profile,
  preferences,
  transferRequests,
  onUpdateProfile,
  onUpdatePreferences,
  onRequestLogout,
  onSubmitTransferRequest,
}) {
  const [activeTab, setActiveTab] = useState(() => {
    const storedTab = loadFromStorage(ADMIN_STORAGE_KEYS.settingsActiveTab, tabs[0])
    return tabs.includes(storedTab) ? storedTab : tabs[0]
  })

  const selectedTheme = preferences?.theme ?? DEFAULT_PREFERENCES.theme
  const selectedFontSize = preferences?.fontSize ?? DEFAULT_PREFERENCES.fontSize
  const motionMode = preferences?.animationsEnabled === false ? 'Reduced' : 'Enabled'

  usePersistToStorage(ADMIN_STORAGE_KEYS.settingsActiveTab, activeTab)

  function updatePreference(field, value) {
    onUpdatePreferences({ [field]: value })
  }

  const tabContent = {
    Account: (
      <AccountSettingsTab
        profile={profile}
        preferences={preferences}
        onUpdatePreference={updatePreference}
        onUpdateProfile={onUpdateProfile}
      />
    ),
    Notifications: (
      <NotificationSettingsTab preferences={preferences} onUpdatePreference={updatePreference} />
    ),
    Appearance: <AppearanceSettingsTab preferences={preferences} onUpdatePreference={updatePreference} />,
    Security: (
      <SecuritySettingsTab
        preferences={preferences}
        onUpdatePreference={updatePreference}
        onRequestLogout={onRequestLogout}
      />
    ),
    Transfers: (
      <DepartmentTransferTab
        profile={profile}
        transferRequests={transferRequests}
        departmentOptions={DEPARTMENT_OPTIONS}
        onSubmitTransferRequest={onSubmitTransferRequest}
      />
    ),
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600">
            Preferences are saved locally and persist after refresh.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Theme: {selectedTheme}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Font size: {selectedFontSize}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Motion: {motionMode}
            </span>
          </div>
        </header>

        <SettingsTabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {tabContent[activeTab]}
      </div>
    </main>
  )
}