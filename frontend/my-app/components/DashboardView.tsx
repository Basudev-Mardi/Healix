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

const pillToneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[#DDE5E7] text-[#3B484D]",
  info: "bg-[#8FC1CE] text-white",
  success: "bg-[#6AB4A4] text-white",
  warning: "bg-[#EB9B52] text-white",
  danger: "bg-[#EF5B3A] text-white",
};

const accentCircleClasses: Record<BadgeTone, string> = {
  neutral: "bg-[#D9E3E6] text-[#2F3B40]",
  info: "bg-[#97C4D0] text-[#17363F]",
  success: "bg-[#86C3B5] text-[#143931]",
  warning: "bg-[#F0B27A] text-[#4A280A]",
  danger: "bg-[#EF5B3A] text-white",
};

const toneLabels: Record<BadgeTone, string> = {
  neutral: "Live",
  info: "Active",
  success: "Healthy",
  warning: "Attention",
  danger: "Alert",
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 0 && word !== "&")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardView({
  roleName,
  category,
  subtitle,
  department,
  kpis,
  sections,
}: DashboardViewProps) {
  const roleInitials = getInitials(roleName);

  return (
    <div className="min-h-screen bg-[#E2E9EB] text-[#14191B] antialiased selection:bg-[#8FC1CE]/40">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Minimal Brand Mark */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6F9F9] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-white/80"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="10" width="4" height="10" rx="2" fill="#181C1E" />
                <rect x="10" y="6" width="4" height="14" rx="2" fill="#4A90A4" />
                <rect x="16" y="3" width="4" height="17" rx="2" fill="#8FC1CE" />
              </svg>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#181C1E] px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(24,28,30,0.12)]">
              {roleName} Dashboard
            </span>

            <span className="inline-flex items-center rounded-full bg-[#EFF3F4] px-3.5 py-2 text-xs font-medium text-[#5A686E] ring-1 ring-white/75">
              {category}
            </span>

            <span className="hidden text-xs font-medium text-[#6B7A80] md:inline">
              {department}
            </span>
          </div>

          {/* Right Role Identity Pill */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="flex items-center gap-3 rounded-full bg-[#F3F7F7] py-1.5 pl-2 pr-4 ring-1 ring-white/85">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181C1E] text-xs font-semibold tracking-wide text-white">
                {roleInitials}
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-medium text-[#75848A]">
                  Healix HMS
                </p>
                <p className="text-xs font-semibold text-[#14191B]">
                  {roleName}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {/* Primary Bento Container: Role Summary & KPIs */}
          <section
            aria-label={`${roleName} key metrics`}
            className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 sm:p-7"
          >
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[#14191B] sm:text-2xl">
                  {roleName} Overview
                </h1>
                <p className="mt-1 text-sm text-[#6B7A80]">{subtitle}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F8FAFA] px-3.5 py-1.5 text-xs font-medium text-[#4A595F] ring-1 ring-white">
                <span className="h-2 w-2 rounded-full bg-[#6AB4A4]" />
                {department}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => {
                const tone: BadgeTone = kpi.tone ?? "info";
                return (
                  <div
                    key={kpi.label}
                    className="relative flex flex-col justify-between rounded-[24px] border border-white/90 bg-[#F6F9FA] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#181E20]">
                          {kpi.label}
                        </p>
                        <span
                          className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${pillToneClasses[tone]}`}
                        >
                          {toneLabels[tone]}
                        </span>
                      </div>

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accentCircleClasses[tone]}`}
                        aria-hidden="true"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 14L14 6" />
                          <path d="M7.5 6H14V12.5" />
                        </svg>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[18px] border border-[#E7EEF0] bg-white px-4 py-3.5">
                      <p className="text-2xl font-semibold tracking-tight text-[#14191B] sm:text-[28px]">
                        {kpi.value}
                      </p>
                      <p className="mt-1 text-xs text-[#738288]">{kpi.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Secondary Bento Grid: Operational Panels */}
          <section
            aria-label={`${roleName} operational overview`}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            {sections.map((section) => (
              <div
                key={section.title}
                className="flex flex-col rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 sm:p-6"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-[#14191B]">
                      {section.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#6E7D83]">
                      {section.description}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-[#F8FAFA] px-3 py-1 text-xs font-medium text-[#526167] ring-1 ring-white">
                    {section.items.length} items
                  </span>
                </div>

                <ul className="space-y-3">
                  {section.items.map((item) => {
                    const tone: BadgeTone = item.tone ?? "neutral";
                    return (
                      <li
                        key={`${section.title}-${item.title}`}
                        className="flex flex-col justify-between gap-3 rounded-[20px] border border-white/90 bg-[#F8FAFA] px-4 py-3.5 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#161C1E]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[#728086]">
                            {item.subtitle}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${pillToneClasses[tone]}`}
                          >
                            {item.status}
                          </span>
                          <span className="text-[11px] font-medium text-[#7C8B91]">
                            {item.meta}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
