import {
  FiUser,
  FiUserX,
  FiSearch,
  FiSliders,
  FiChevronDown,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiMoreHorizontal,
} from 'react-icons/fi'
import { usersFilters, usersPagination, usersRows, usersStats } from './usersData'

const statusStyles = {
  Verified: 'bg-blue-100 text-blue-700 border-blue-200',
  Unverified: 'bg-rose-100 text-rose-700 border-rose-200',
}

function StatCard({ label, value, icon, accent }) {
  const accentStyles = {
    indigo: 'bg-indigo-100 text-indigo-700',
    orange: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm border border-slate-200">
      <div className={`rounded-full p-3 ${accentStyles[accent]}`}>
        {icon === 'user' ? <FiUser className="text-xl" /> : <FiUserX className="text-xl" />}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const isVerified = status === 'Verified'
  const Icon = isVerified ? FiCheckCircle : FiXCircle

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        statusStyles[status]
      }`}
    >
      <Icon className="text-sm" />
      {status}
    </span>
  )
}

export function Users() {
  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 text-xs text-slate-600">
            !
          </span>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {usersStats.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </div>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <FiSearch className="text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder={usersFilters.searchPlaceholder}
                type="text"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
            >
              <FiSliders className="text-sm" />
              Sort
              <FiChevronDown className="text-sm" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
            >
              <FiSliders className="text-sm" />
              Filter
              <FiChevronDown className="text-sm" />
            </button>

            <button
              type="button"
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <FiPlus />
              {usersFilters.primaryAction}
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr] items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span />
                <span>User Details</span>
                <span>Address</span>
                <span>Account Status</span>
                <span>Registered Date</span>
                <span>Action</span>
              </div>

              <div className="divide-y divide-slate-200">
                {usersRows.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[32px_2.2fr_1.4fr_1.2fr_1.2fr_0.6fr] items-center gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {user.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{user.address}</p>
                    <StatusPill status={user.status} />
                    <p className="text-sm text-slate-700">{user.registeredAt}</p>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500"
                    >
                      <FiMoreHorizontal />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-4 text-sm text-slate-600">
            <button type="button" className="rounded-full border border-slate-200 px-3 py-1">Previous</button>
            {usersPagination.visiblePages.map((page) => (
              <button
                key={page}
                type="button"
                className={`h-8 w-8 rounded-full border ${
                  page === usersPagination.currentPage
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {page}
              </button>
            ))}
            <span className="px-2">...</span>
            <span className="rounded-full border border-slate-200 px-3 py-1">{usersPagination.totalPages}</span>
            <button type="button" className="rounded-full border border-slate-200 px-3 py-1">Next</button>
          </div>
        </section>
      </div>
    </main>
  )
}