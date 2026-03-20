import {
  FiBriefcase,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import { formatDateTime } from "../../models/data";

const fieldConfig = [
  { key: "email", label: "Email", icon: FiMail },
  { key: "department", label: "Department", icon: FiBriefcase },
  { key: "phone", label: "Phone", icon: FiPhone },
  { key: "address", label: "Address", icon: FiMapPin },
];

export function ProfileSummaryCard({ profile }) {
  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <div className="grid h-15 w-15 place-items-center rounded-full bg-cyan-100 text-lg font-semibold text-cyan-700">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {profile.fullName}
            </h2>
            <p className="text-sm text-slate-600">{profile.role}</p>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Active account
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {fieldConfig.map((field) => {
          const IconComponent = field.icon;

          return (
            <article
              key={field.key}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <IconComponent className="text-slate-500" />
                {field.label}
              </div>
              <p className="text-sm text-slate-800">
                {profile[field.key] || "Not provided"}
              </p>
            </article>
          );
        })}

        <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <FiCalendar className="text-slate-500" />
            Joined
          </div>
          <p className="text-sm text-slate-800">
            {formatDateTime(profile.joinedAt)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <FiCalendar className="text-slate-500" />
            Last login
          </div>
          <p className="text-sm text-slate-800">
            {formatDateTime(profile.lastLoginAt)}
          </p>
        </article>
      </div>
    </section>
  );
}
