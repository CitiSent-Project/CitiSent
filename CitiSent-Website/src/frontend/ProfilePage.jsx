import { useState } from 'react'
import { ProfileSummaryCard } from '../components/Account-Ui'
import { formatDateTime } from './Data/adminPortalData'

export function ProfileInformation({ profile, activityLog, onUpdateProfile }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    fullName: profile.fullName,
    department: profile.department,
    phone: profile.phone,
    address: profile.address,
  })

  function updateDraft(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }))
  }

  function startEditing() {
    setDraft({
      fullName: profile.fullName,
      department: profile.department,
      phone: profile.phone,
      address: profile.address,
    })
    setEditing(true)
  }

  function saveProfile() {
    onUpdateProfile(draft)
    setEditing(false)
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Profile</h1>
            <p className="text-sm text-slate-600">Profile data is powered by your registration details.</p>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          )}
        </header>

        <ProfileSummaryCard profile={profile} />

        {editing ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Editable details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-700">Full name</label>
                <input
                  value={draft.fullName}
                  onChange={(event) => updateDraft('fullName', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Department</label>
                <input
                  value={draft.department}
                  onChange={(event) => updateDraft('department', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Phone</label>
                <input
                  value={draft.phone}
                  onChange={(event) => updateDraft('phone', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Address</label>
                <input
                  value={draft.address}
                  onChange={(event) => updateDraft('address', event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          <div className="mt-4 space-y-2">
            {activityLog.length > 0 ? (
              activityLog.slice(0, 6).map((entry) => (
                <article
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.action}</p>
                    <p className="text-xs text-slate-500">{entry.detail}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</span>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-500">
                Activity will appear here as you use the admin portal.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}