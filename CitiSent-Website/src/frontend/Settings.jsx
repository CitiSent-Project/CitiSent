import { useState } from 'react'
import {
  AccountSettingsTab,
  AppearanceSettingsTab,
  NotificationSettingsTab,
  SecuritySettingsTab,
  SettingsTabNav,
} from '../components/Settings-Ui'

const tabs = ['Account', 'Notifications', 'Appearance', 'Security']

export function Settings({ profile, preferences, onUpdateProfile, onUpdatePreferences, onRequestLogout }) {
  const [activeTab, setActiveTab] = useState('Account')

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
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600">
            Preferences are saved locally and persist after refresh.
          </p>
        </header>

        <SettingsTabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {tabContent[activeTab]}
      </div>
    </main>
  )
}