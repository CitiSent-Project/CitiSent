export function UserProfilePage({ user, onBackToUsers }) {
  if (!user) {
    return (
      <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 text-sm text-slate-500">
            <button onClick={onBackToUsers} className="hover:text-slate-700">Users</button> / <span>User Profile</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">User not found</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-4 text-sm text-slate-500">
        <button onClick={onBackToUsers} className="hover:text-slate-700">Users</button> / <span className="text-slate-700">User Profile</span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">User Profile</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">User ID</p>
            <p className="text-slate-900 font-numeric">{user.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Full Name</p>
            <p className="text-slate-900">{user.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
            <p className="text-slate-900">{user.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <p className="text-slate-900">{user.status}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
            <p className="text-slate-900">{user.address}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Registered At</p>
            <p className="text-slate-900 font-numeric">{user.registeredAt}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
