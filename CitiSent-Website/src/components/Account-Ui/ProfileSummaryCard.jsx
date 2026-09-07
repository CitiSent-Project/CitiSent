import {
  FiBriefcase,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
  FiAtSign,
} from "react-icons/fi";
import { formatDateTime } from "../../models/data";
import { composeFullName } from "../../models/nameModel";

const fieldConfig = [
  { key: "username", label: "Username", icon: FiAtSign },
  { key: "email", label: "Email", icon: FiMail },
  { key: "department", label: "Department", icon: FiBriefcase },
  { key: "phone", label: "Phone", icon: FiPhone },
  { key: "barangay", label: "Barangay", icon: FiMapPin },
  { key: "city", label: "City", icon: FiMapPin },
  { key: "province", label: "Province", icon: FiMapPin },
];

export function ProfileSummaryCard({ profile }) {
  const displayName =
    profile.fullName ||
    composeFullName({
      fname: profile.fname,
      mname: profile.mname,
      lname: profile.lname,
    }) || "Admin User";
    
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "AU";

  const formattedUsername = profile.username
    ? profile.username.startsWith("@")
      ? profile.username
      : `@${profile.username}`
    : "Not assigned";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-900 text-xl font-bold text-white shadow-sm ring-4 ring-blue-50 dark:ring-blue-950/40">
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {displayName}
              </h2>
              {profile.username ? (
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/40 dark:text-blue-300">
                  {formattedUsername}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                <FiUser className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                {profile.role || "Administrator"}
              </span>
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active account
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fieldConfig.map((field) => {
          const IconComponent = field.icon;
          const value = profile[field.key];
          const displayVal = field.key === "username" && value && !value.startsWith("@")
            ? `@${value}`
            : value || "Not provided";

          return (
            <article
              key={field.key}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <IconComponent className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                {field.label}
              </div>
              <p className="text-sm font-medium text-slate-800 wrap-break-word dark:text-slate-200">
                {displayVal}
              </p>
            </article>
          );
        })}

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <FiCalendar className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
            Joined
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {formatDateTime(profile.joinedAt)}
          </p>
        </article>
      </div>
    </section>
  );
}
