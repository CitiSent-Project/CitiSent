import { useState } from 'react'
import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_PREFERENCES,
} from '../../models/data'
import { usePersistToStorage } from '../../hooks/shared/usePersistToStorage'
import { loadFromStorage } from '../../services/storageService'
import {
  AppearanceSettingsTab,
  AuditLogsSettingsTab,
  NotificationSettingsTab,
  ReportManagementSettingsTab,
  SecuritySettingsTab,
  SettingsTabNav,
  SystemSettingsTab,
} from '../../components/Settings-Ui'

const tabs = [
  'Appearance',
  'Security',
  'Notifications',
  'Report Management',
  'Audit & Logs',
  'System',
]

export function Settings({
  profile,
  accessToken,
  preferences,
  activityLog = [],
  onUpdatePreferences,
  onRequestLogout,
}) {
  const [activeTab, setActiveTab] = useState(() => {
    const storedTab = loadFromStorage(ADMIN_STORAGE_KEYS.settingsActiveTab, tabs[0])
    return tabs.includes(storedTab) ? storedTab : tabs[0]
  })

  const selectedTheme = preferences?.theme ?? DEFAULT_PREFERENCES.theme
  const selectedFontSize = preferences?.fontSize ?? DEFAULT_PREFERENCES.fontSize
  const reportsPerPage = preferences?.reportsPerPage ?? DEFAULT_PREFERENCES.reportsPerPage
  const timezone = preferences?.timezone ?? DEFAULT_PREFERENCES.timezone

  usePersistToStorage(ADMIN_STORAGE_KEYS.settingsActiveTab, activeTab)

  function updatePreference(field, value) {
    onUpdatePreferences({ [field]: value })
  }

  const tabContent = {
    Appearance: <AppearanceSettingsTab preferences={preferences} onUpdatePreference={updatePreference} />,
    Security: (
      <SecuritySettingsTab
        profile={profile}
        accessToken={accessToken}
        preferences={preferences}
        onUpdatePreference={updatePreference}
        onRequestLogout={onRequestLogout}
      />
    ),
    Notifications: (
      <NotificationSettingsTab preferences={preferences} onUpdatePreference={updatePreference} />
    ),
    'Report Management': (
      <ReportManagementSettingsTab
        preferences={preferences}
        onUpdatePreference={updatePreference}
      />
    ),
    'Audit & Logs': (
      <AuditLogsSettingsTab
        activityLog={activityLog}
        preferences={preferences}
        onUpdatePreference={updatePreference}
      />
    ),
    System: (
      <SystemSettingsTab
        activityLog={activityLog}
        preferences={preferences}
        onUpdatePreference={updatePreference}
        onOpenActivityLogs={() => setActiveTab('Audit & Logs')}
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
              Reports/page: {reportsPerPage}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Timezone: {timezone}
            </span>
          </div>
        </header>

        <SettingsTabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {tabContent[activeTab]}
      </div>
    </main>
  )
}
