import React from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface KpiMetric {
  label: string;
  value: string;
  detail: string;
  tone?: BadgeTone;
}

export interface DashboardListItem {
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  tone?: BadgeTone;
}

export interface DashboardSection {
  title: string;
  description: string;
  items: DashboardListItem[];
}

export interface DashboardViewProps {
  roleName: string;
  category: "Core Role" | "Specialist Role";
  subtitle: string;
  department: string;
  kpis: KpiMetric[];
  sections: DashboardSection[];
}

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  info: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800",
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800",
  danger:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800",
};

export function DashboardView({
  roleName,
  category,
  subtitle,
  department,
  kpis,
  sections,
}: DashboardViewProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                Healix HMS
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800">
                {category}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {department}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              {roleName} Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Role: {roleName}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section aria-label={`${roleName} key metrics`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {kpi.label}
                  </p>
                  {kpi.tone && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${toneClasses[kpi.tone]}`}
                    >
                      {kpi.tone === "danger"
                        ? "Alert"
                        : kpi.tone === "warning"
                          ? "Attention"
                          : kpi.tone === "success"
                            ? "Healthy"
                            : "Live"}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {kpi.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-label={`${roleName} operational overview`}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {sections.map((section) => (
            <div
              key={section.title}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {section.title}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {section.description}
                </p>
              </div>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {section.items.map((item) => (
                  <li
                    key={`${section.title}-${item.title}`}
                    className="flex items-start justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[item.tone ?? "neutral"]}`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.meta}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
