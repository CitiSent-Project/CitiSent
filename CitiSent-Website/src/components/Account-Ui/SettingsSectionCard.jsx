import { ComponentGuideTrigger } from "../Guide-Ui";

export function SettingsSectionCard({ title, description, children, guideId }) {
  return (
    <section data-guide={guideId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
      <header className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-700 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        {guideId && <ComponentGuideTrigger guideId={guideId} />}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
