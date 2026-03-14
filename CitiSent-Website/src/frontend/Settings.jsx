import { useState } from 'react'
import { SettingToggleRow, SettingsSectionCard } from '../components/Account-Ui'

const tabs = ['Account', 'Notifications', 'Appearance', 'Security']

export function Settings({ profile, preferences, onUpdateProfile, onUpdatePreferences, onRequestLogout }) {
  const [activeTab, setActiveTab] = useState('Account')

  function updatePreference(field, value) {
    onUpdatePreferences({ [field]: value })
  }

  function renderTabContent() {
    if (activeTab === 'Account') {
      return (
        <SettingsSectionCard
          title="Account settings"
          description="Control how your admin profile appears inside the dashboard."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-700">Display name</label>
              <input
                value={preferences.displayName}
                onChange={(event) => updatePreference('displayName', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Department</label>
              <input
                value={preferences.department}
                onChange={(event) => {
                  updatePreference('department', event.target.value)
                  onUpdateProfile({ department: event.target.value })
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Email (read-only)</label>
              <input
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Role (read-only)</label>
              <input
                value={profile.role}
                disabled
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
              />
            </div>
          </div>
        </SettingsSectionCard>
      )
    }

    if (activeTab === 'Notifications') {
      return (
        <SettingsSectionCard
          title="Notification preferences"
          description="Choose which updates you want to receive while managing reports."
        >
          <SettingToggleRow
            title="Enable notifications"
            description="Master switch for all incoming admin notifications."
            checked={preferences.notificationsEnabled}
            onChange={(value) => updatePreference('notificationsEnabled', value)}
          />

          <SettingToggleRow
            title="Report status updates"
            description="Get alerts when a report status changes."
            checked={preferences.reportStatusUpdates}
            onChange={(value) => updatePreference('reportStatusUpdates', value)}
          />

          <SettingToggleRow
            title="Admin invitations"
            description="Receive notifications when admin invitations are created."
            checked={preferences.adminInvitations}
            onChange={(value) => updatePreference('adminInvitations', value)}
          />

          <div>
            <label className="mb-1 block text-sm text-slate-700">Digest frequency</label>
            <select
              value={preferences.digestFrequency}
              onChange={(event) => updatePreference('digestFrequency', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </SettingsSectionCard>
      )
    }

    if (activeTab === 'Appearance') {
      return (
        <SettingsSectionCard
          title="Appearance"
          description="Set visual preferences for readability and comfort."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-700">Theme</label>
              <select
                value={preferences.theme}
                onChange={(event) => updatePreference('theme', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-700">Font size</label>
              <select
                value={preferences.fontSize}
                onChange={(event) => updatePreference('fontSize', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
          </div>

          <SettingToggleRow
            title="Enable animations"
            description="Keep page transitions and feedback animations active."
            checked={preferences.animationsEnabled}
            onChange={(value) => updatePreference('animationsEnabled', value)}
          />
        </SettingsSectionCard>
      )
    }

    return (
      <SettingsSectionCard
        title="Security and session"
        description="Set timeout rules and manage active account sessions."
      >
        <div>
          <label className="mb-1 block text-sm text-slate-700">Session timeout</label>
          <select
            value={preferences.sessionTimeout}
            onChange={(event) => updatePreference('sessionTimeout', Number(event.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-medium text-rose-700">Security action</p>
          <p className="mt-1 text-xs text-rose-600">
            For demo purposes, sign out and return to the login screen.
          </p>
          <button
            type="button"
            onClick={onRequestLogout}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
          >
            Sign out now
          </button>
        </div>
      </SettingsSectionCard>
    )
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

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    </main>
  )
}