import { useEffect, useState } from 'react'
import {
  ADMIN_STORAGE_KEYS,
  DEFAULT_PREFERENCES,
} from '../../models/data'
import { APP_PAGES } from '../../models/pageModel'
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

const PAGE_KEY_TO_TAB = {
  [APP_PAGES.SETTINGS_APPEARANCE]: 'Appearance',
  [APP_PAGES.SETTINGS_SECURITY]: 'Security',
  [APP_PAGES.SETTINGS_NOTIFICATIONS]: 'Notifications',
  [APP_PAGES.SETTINGS_REPORT_MANAGEMENT]: 'Report Management',
  [APP_PAGES.SETTINGS_AUDIT_LOGS]: 'Audit & Logs',
  [APP_PAGES.SETTINGS_SYSTEM]: 'System',
}

const TAB_TO_PAGE_KEY = {
  Appearance: APP_PAGES.SETTINGS_APPEARANCE,
  Security: APP_PAGES.SETTINGS_SECURITY,
  Notifications: APP_PAGES.SETTINGS_NOTIFICATIONS,
  'Report Management': APP_PAGES.SETTINGS_REPORT_MANAGEMENT,
  'Audit & Logs': APP_PAGES.SETTINGS_AUDIT_LOGS,
  System: APP_PAGES.SETTINGS_SYSTEM,
}

export function Settings({
  activePage,
  profile,
  accessToken,
  preferences,
  activityLog = [],
  onUpdatePreferences,
  onRequestLogout,
  onNavigate,
}) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activePage && PAGE_KEY_TO_TAB[activePage]) {
      return PAGE_KEY_TO_TAB[activePage]
    }
    const storedTab = loadFromStorage(ADMIN_STORAGE_KEYS.settingsActiveTab, tabs[0])
    return tabs.includes(storedTab) ? storedTab : tabs[0]
  })

  useEffect(() => {
    if (activePage && PAGE_KEY_TO_TAB[activePage]) {
      setActiveTab(PAGE_KEY_TO_TAB[activePage])
    }
  }, [activePage])

  const selectedTheme = preferences?.theme ?? DEFAULT_PREFERENCES.theme
  const selectedFontSize = preferences?.fontSize ?? DEFAULT_PREFERENCES.fontSize
  const reportsPerPage = preferences?.reportsPerPage ?? DEFAULT_PREFERENCES.reportsPerPage
  const timezone = preferences?.timezone ?? DEFAULT_PREFERENCES.timezone

  usePersistToStorage(ADMIN_STORAGE_KEYS.settingsActiveTab, activeTab)

  function updatePreference(field, value) {
    onUpdatePreferences({ [field]: value })
  }

  function handleTabChange(nextTab) {
    setActiveTab(nextTab)
    if (onNavigate && TAB_TO_PAGE_KEY[nextTab]) {
      onNavigate(TAB_TO_PAGE_KEY[nextTab])
    }
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
        onOpenActivityLogs={() => handleTabChange('Audit & Logs')}
      />
    ),
  }

  return (
    <main className="w-full flex-1 min-w-0 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900">
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{activeTab}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeTab} Settings
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Preferences are saved locally and persist after refresh.
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Theme: {selectedTheme}
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Font size: {selectedFontSize}
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Reports/page: {reportsPerPage}
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Timezone: {timezone}
              </span>
            </div>
          </div>
        </header>

        <SettingsTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        {tabContent[activeTab]}
      </div>
    </main>
  )
}
