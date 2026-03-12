import { useState } from 'react'

const initialForm = {
  name: '',
  email: '',
  address: '',
  status: 'Verified',
}

export function AddUserFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm)

  if (!isOpen) {
    return null
  }

  function updateField(field, value) {
    setForm((previousForm) => ({ ...previousForm, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(form)
    setForm(initialForm)
  }

  function handleClose() {
    onClose()
    setForm(initialForm)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add New User</h2>
          <p className="mt-1 text-sm text-slate-500">Fill in the required user details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="janedoe@gmail.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              placeholder="San Isidro Norte"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Account Status</label>
            <select
              value={form.status}
              onChange={(event) => updateField('status', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="Verified">Verified</option>
              <option value="Unverified">Unverified</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Save User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
