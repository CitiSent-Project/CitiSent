import { SettingsSectionCard } from "../Account-Ui";
import { SettingsSelect } from "./SettingsSelect";

const timeoutOptions = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "60 minutes", value: 60 },
];

export function SecuritySettingsTab({
  preferences,
  onUpdatePreference,
  onRequestLogout,
}) {
  const sessionTimeout = preferences?.sessionTimeout ?? 30;

  function handleSessionTimeoutChange(event) {
    onUpdatePreference("sessionTimeout", Number(event.target.value));
  }

  function handleLogoutClick() {
    onRequestLogout();
  }

  return (
    <SettingsSectionCard
      title="Security"
      description="Manage session behavior and review security actions."
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-800">Change password</p>
        <p className="mt-1 text-xs text-slate-500">
          Password changes will be connected once the account security API is available.
        </p>
        <button
          type="button"
          disabled
          className="mt-3 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400"
        >
          Coming soon
        </button>
      </div>

      <SettingsSelect
        label="Session timeout"
        value={sessionTimeout}
        onChange={handleSessionTimeoutChange}
        options={timeoutOptions}
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-800">Two-Factor Authentication</p>
        <p className="mt-1 text-xs text-slate-500">
          2FA enrollment is currently unavailable and has not been enabled for this portal.
        </p>
        <button
          type="button"
          disabled
          className="mt-3 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400"
        >
          Not enabled
        </button>
      </div>

      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <p className="text-sm font-medium text-red-900">Security action</p>
        <p className="mt-1 text-xs text-rose-600">
          For demo purposes, sign out and return to the login screen.
        </p>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
        >
          Sign out now
        </button>
      </div>
    </SettingsSectionCard>
  );
}
