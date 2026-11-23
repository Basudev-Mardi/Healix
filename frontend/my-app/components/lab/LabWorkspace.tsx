"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { hasLabPermission, LAB_ROLES } from "@/lib/lab/permissions";
import type { LabRole, LabState } from "@/lib/lab/types";
import { DigitalReportsSection } from "./DigitalReportsSection";
import { ResultVerificationSection } from "./ResultVerificationSection";
import { SampleCollectionSection } from "./SampleCollectionSection";
import { SampleTrackingSection } from "./SampleTrackingSection";
import { TestCatalogSection } from "./TestCatalogSection";
import { TestProcessingSection } from "./TestProcessingSection";
import { TestRequestsSection } from "./TestRequestsSection";

type LabTab =
  | "catalog"
  | "requests"
  | "collection"
  | "tracking"
  | "processing"
  | "verification"
  | "reports";

const LAB_TABS: { id: LabTab; label: string }[] = [
  { id: "catalog", label: "1. Test Catalog" },
  { id: "requests", label: "2. Test Requests" },
  { id: "collection", label: "3. Sample Collection" },
  { id: "tracking", label: "4. Sample Tracking" },
  { id: "processing", label: "5. Test Processing" },
  { id: "verification", label: "6. Result Verification" },
  { id: "reports", label: "7. Digital Reports" },
];

export function LabWorkspace() {
  const [role, setRole] = useState<LabRole>("Laboratory Staff");
  const [activeTab, setActiveTab] = useState<LabTab>("requests");
  const [state, setState] = useState<LabState | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffRequestId, setHandoffRequestId] = useState<string | undefined>(
    undefined
  );
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/lab/state"), {
          headers: { "x-lab-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load Laboratory state.");
        }
        if (!cancelled) {
          setState(data as LabState);
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text:
              err instanceof Error
                ? err.message
                : "Could not reach Laboratory API.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function refreshState() {
    const res = await fetch(apiUrl("/api/lab/state"), {
      headers: { "x-lab-role": role },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh Laboratory state.");
    }
    setState(data as LabState);
  }

  async function mutate(
    path: string,
    method: "POST" | "PATCH",
    body: unknown,
    successMessage: string
  ): Promise<boolean> {
    setBanner(null);
    try {
      const res = await fetch(apiUrl(path), {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-lab-role": role,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Operation failed.");
      }
      await refreshState();
      setBanner({ type: "success", text: successMessage });
      return true;
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Operation failed.",
      });
      return false;
    }
  }

  const activeTestsCount =
    state?.tests.filter((t) => t.isActive).length ?? 0;
  const pendingRequestsCount =
    state?.requests.filter(
      (r) => r.status !== "Completed" && r.status !== "Cancelled"
    ).length ?? 0;
  const pendingVerificationCount =
    state?.results.filter((r) => r.verificationStatus === "Pending").length ??
    0;
  const digitalReportsCount = state?.reports.length ?? 0;

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Top Header */}
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Module 07 • LIS
              </span>
              <Link
                href="/"
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#47565C] transition hover:bg-[#F8FAFA]"
              >
                ← Back to Hub
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              Laboratory Management (LIS)
            </h1>
            <p className="text-xs text-[#6B7A80]">
              End-to-end diagnostic workflow: Test Catalog, Requests, Sample
              Collection & Tracking, Processing, Verification, and Digital PDF
              Reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A80]">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as LabRole);
                setBanner(null);
              }}
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {LAB_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* KPI Strip */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Active Lab Tests",
              value: activeTestsCount,
              accent: "bg-[#6AB4A4]",
            },
            {
              label: "Open Test Requests",
              value: pendingRequestsCount,
              accent: "bg-[#8FC1CE]",
            },
            {
              label: "Awaiting Verification",
              value: pendingVerificationCount,
              accent: "bg-[#EB9B52]",
            },
            {
              label: "Digital Reports",
              value: digitalReportsCount,
              accent: "bg-[#4A90A4]",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-[24px] border border-white/80 bg-[#EDF2F3] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B7A80]">
                  {kpi.label}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${kpi.accent}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#14191B]">
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        {/* Workflow Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2">
          {LAB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[#181C1E] text-white"
                  : "bg-transparent text-[#47565C] hover:bg-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Feedback Banner */}
        {banner && (
          <div
            className={`flex items-center justify-between rounded-[20px] px-4 py-3 text-xs font-semibold ${
              banner.type === "success"
                ? "bg-[#E4F4F0] text-[#1F6355]"
                : "bg-[#FCEBE7] text-[#B8381B]"
            }`}
          >
            <span>{banner.text}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="ml-4 opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Workflow Panel */}
        {loading || !state ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-12 text-center text-sm text-[#6B7A80]">
            Loading Laboratory Management workspace...
          </div>
        ) : (
          <>
            {activeTab === "catalog" && (
              <TestCatalogSection
                tests={state.tests}
                canManage={hasLabPermission(role, "lab:catalog:manage")}
                onCreateTest={(payload) =>
                  mutate(
                    "/api/lab/tests",
                    "POST",
                    payload,
                    `Test ${payload.testCode.toUpperCase()} added to catalog.`
                  )
                }
                onToggleActive={async (testId, isActive) => {
                  await mutate(
                    "/api/lab/tests",
                    "PATCH",
                    { testId, isActive },
                    `Test ${testId} marked ${isActive ? "Active" : "Inactive"}.`
                  );
                }}
              />
            )}

            {activeTab === "requests" && (
              <TestRequestsSection
                patients={state.patients}
                doctors={state.doctors}
                tests={state.tests}
                requests={state.requests}
                canCreate={hasLabPermission(role, "lab:request:create")}
                canUpdateStatus={hasLabPermission(role, "lab:sample:track")}
                onCreateRequest={(payload) =>
                  mutate(
                    "/api/lab/requests",
                    "POST",
                    payload,
                    "Laboratory test request created."
                  )
                }
                onCancelRequest={async (requestId) => {
                  await mutate(
                    "/api/lab/requests",
                    "PATCH",
                    { requestId, status: "Cancelled" },
                    `Lab request ${requestId} cancelled.`
                  );
                }}
                onNavigateRequest={(tab, requestId) => {
                  setHandoffRequestId(requestId);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === "collection" && (
              <SampleCollectionSection
                requests={state.requests}
                samples={state.samples}
                preselectedRequestId={handoffRequestId}
                canCollect={hasLabPermission(role, "lab:sample:collect")}
                onCollect={(payload) =>
                  mutate(
                    "/api/lab/samples",
                    "POST",
                    payload,
                    payload.status === "Rejected"
                      ? `Sample for ${payload.requestId} recorded as Rejected.`
                      : `Sample collected for ${payload.requestId}.`
                  )
                }
              />
            )}

            {activeTab === "tracking" && (
              <SampleTrackingSection
                samples={state.samples}
                canTrack={hasLabPermission(role, "lab:sample:track")}
                onAdvanceSample={async (payload) => {
                  await mutate(
                    "/api/lab/samples",
                    "PATCH",
                    payload,
                    `Sample ${payload.sampleId} updated to ${payload.status}.`
                  );
                }}
              />
            )}

            {activeTab === "processing" && (
              <TestProcessingSection
                requests={state.requests}
                samples={state.samples}
                tests={state.tests}
                results={state.results}
                preselectedRequestId={handoffRequestId}
                canProcess={hasLabPermission(role, "lab:process")}
                onSaveResult={(payload) =>
                  mutate(
                    "/api/lab/results",
                    "POST",
                    payload,
                    `Result saved for request ${payload.requestId}.`
                  )
                }
              />
            )}

            {activeTab === "verification" && (
              <ResultVerificationSection
                results={state.results}
                canVerify={hasLabPermission(role, "lab:verify")}
                onVerifyResult={async (payload) => {
                  await mutate(
                    "/api/lab/results",
                    "PATCH",
                    payload,
                    `Result ${payload.resultId} marked ${payload.status}.`
                  );
                }}
              />
            )}

            {activeTab === "reports" && (
              <DigitalReportsSection
                requests={state.requests}
                results={state.results}
                reports={state.reports}
                preselectedRequestId={handoffRequestId}
                canGenerate={hasLabPermission(role, "lab:report:generate")}
                onGenerateReport={(requestId) =>
                  mutate(
                    "/api/lab/reports",
                    "POST",
                    { requestId },
                    `Digital lab report generated for ${requestId}.`
                  )
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
