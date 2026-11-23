"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { hasIpdPermission, IPD_ROLES } from "@/lib/ipd/permissions";
import type {
  IpdAdmissionRequest,
  IpdRole,
  IpdState,
} from "@/lib/ipd/types";
import { AdmissionRequestsSection } from "./AdmissionRequestsSection";
import { DailyProgressNotesSection } from "./DailyProgressNotesSection";
import { DischargeManagementSection } from "./DischargeManagementSection";
import { DischargeSummariesSection } from "./DischargeSummariesSection";
import { PatientAdmissionSection } from "./PatientAdmissionSection";
import { PatientTransfersSection } from "./PatientTransfersSection";
import { TreatmentPlansSection } from "./TreatmentPlansSection";

type IpdTab =
  | "admission"
  | "requests"
  | "discharge"
  | "transfers"
  | "progress"
  | "treatment"
  | "summary";

const IPD_TABS: { id: IpdTab; label: string; step: number }[] = [
  { id: "admission", label: "Patient Admission", step: 1 },
  { id: "requests", label: "Admission Requests", step: 2 },
  { id: "discharge", label: "Discharge Management", step: 3 },
  { id: "transfers", label: "Patient Transfers", step: 4 },
  { id: "progress", label: "Daily Progress Notes", step: 5 },
  { id: "treatment", label: "Treatment Plans", step: 6 },
  { id: "summary", label: "Discharge Summaries", step: 7 },
];

export function IpdWorkspace() {
  const [role, setRole] = useState<IpdRole>("Super Admin");
  const [activeTab, setActiveTab] = useState<IpdTab>("admission");
  const [db, setDb] = useState<IpdState | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffAdmissionId, setHandoffAdmissionId] = useState<
    string | undefined
  >(undefined);
  const [convertingRequest, setConvertingRequest] =
    useState<IpdAdmissionRequest | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(apiUrl("/api/ipd/state"), {
          headers: { "x-ipd-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Failed to load IPD Management data.",
          });
          return;
        }
        setDb(data as IpdState);
      } catch {
        if (!cancelled) {
          setNotice({
            type: "error",
            text: "Unable to reach Healix Backend API. Start backend with `cd backend && npm run dev`.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const refreshState = useCallback(async () => {
    const res = await fetch(apiUrl("/api/ipd/state"), {
      headers: { "x-ipd-role": role },
      cache: "no-store",
    });
    if (res.ok) {
      setDb((await res.json()) as IpdState);
    }
  }, [role]);

  const apiCall = useCallback(
    async <T,>(
      url: string,
      method: "POST" | "PATCH",
      body: unknown
    ): Promise<T | null> => {
      try {
        const res = await fetch(apiUrl(url), {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-ipd-role": role,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "IPD operation failed.",
          });
          return null;
        }
        await refreshState();
        return data as T;
      } catch {
        setNotice({
          type: "error",
          text: "Network error communicating with Healix Backend API.",
        });
        return null;
      }
    },
    [role, refreshState]
  );

  const summary = useMemo(() => {
    if (!db) {
      return { activeInpatients: 0, availableBeds: 0, pendingRequests: 0, pendingDischarges: 0 };
    }
    return {
      activeInpatients: db.admissions.filter((a) => a.status !== "Discharged")
        .length,
      availableBeds: db.beds.filter((b) => b.status === "Available").length,
      pendingRequests: db.requests.filter((r) => r.status === "Pending").length,
      pendingDischarges: db.discharges.filter((d) => d.status === "Pending")
        .length,
    };
  }, [db]);

  return (
    <div className="min-h-screen bg-[#E2E9EB] text-[#14191B] antialiased">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6F9F9] ring-1 ring-white/80"
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
                <rect x="16" y="3" width="4" height="17" rx="2" fill="#6AB4A4" />
              </svg>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#181C1E] px-5 py-2.5 text-sm font-semibold text-white">
              IPD Management
            </span>

            <span className="inline-flex items-center rounded-full bg-[#EFF3F4] px-3.5 py-2 text-xs font-medium text-[#5A686E] ring-1 ring-white/75">
              Module 03 • Inpatient Admissions, Care &amp; Discharge
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="ipd-role-select"
              className="text-xs font-semibold text-[#526167]"
            >
              Active Role:
            </label>
            <select
              id="ipd-role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as IpdRole);
                setNotice(null);
              }}
              className="rounded-full border border-white bg-[#F5F8F9] px-4 py-2 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {IPD_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Live IPD KPI Strip */}
        <section
          aria-label="IPD Live Summary"
          className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {[
            {
              label: "Active Inpatients",
              value: String(summary.activeInpatients),
              badge: "Census",
              tone: "bg-[#8FC1CE]",
            },
            {
              label: "Available Beds",
              value: String(summary.availableBeds),
              badge: "Ready",
              tone: "bg-[#6AB4A4]",
            },
            {
              label: "Pending Admission Requests",
              value: String(summary.pendingRequests),
              badge: "Review",
              tone: "bg-[#EB9B52]",
            },
            {
              label: "Pending Discharges",
              value: String(summary.pendingDischarges),
              badge: "Clearance",
              tone: "bg-[#4A90A4]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[24px] border border-white/85 bg-[#EDF2F3] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#5A686E]">
                  {stat.label}
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white ${stat.tone}`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#14191B]">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* 7-Workflow Navigation */}
        <nav
          aria-label="IPD Workflows"
          className="mb-6 flex flex-wrap gap-2 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2.5"
        >
          {IPD_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#181C1E] text-white shadow-xs"
                    : "bg-[#F8FAFA] text-[#4C5B61] hover:bg-white"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-[#8FC1CE] text-[#14191B]"
                      : "bg-[#E2E9EB] text-[#47565C]"
                  }`}
                >
                  {tab.step}
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Status Banner */}
        {notice && (
          <div
            role="status"
            className={`mb-6 flex items-center justify-between gap-4 rounded-[20px] px-5 py-3.5 text-xs font-medium ${
              notice.type === "error"
                ? "border border-[#EF5B3A]/40 bg-[#EF5B3A]/12 text-[#8F2710]"
                : "border border-[#6AB4A4]/40 bg-[#6AB4A4]/15 text-[#174A40]"
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active IPD Workflow */}
        {loading || !db ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-10 text-center text-sm text-[#6B7A80]">
            Loading IPD Management workflows...
          </div>
        ) : (
          <main>
            {activeTab === "admission" && (
              <PatientAdmissionSection
                patients={db.patients}
                doctors={db.doctors}
                beds={db.beds}
                admissions={db.admissions}
                convertingRequest={convertingRequest}
                canWrite={hasIpdPermission(role, "admission:write")}
                onClearConvertingRequest={() => setConvertingRequest(null)}
                onCreateAdmission={async (payload) => {
                  const res = await apiCall<{
                    admission: { id: string; patientName: string; bedLabel: string };
                  }>("/api/ipd/admissions", "POST", payload);
                  if (res?.admission) {
                    setNotice({
                      type: "success",
                      text: `Admitted ${res.admission.patientName} (${res.admission.id}) to ${res.admission.bedLabel}.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onNavigateAdmission={(tab, admissionId) => {
                  setHandoffAdmissionId(admissionId);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === "requests" && (
              <AdmissionRequestsSection
                patients={db.patients}
                doctors={db.doctors}
                requests={db.requests}
                canCreate={hasIpdPermission(role, "request:create")}
                canReview={hasIpdPermission(role, "request:review")}
                canAdmit={hasIpdPermission(role, "admission:write")}
                onCreateRequest={async (payload) => {
                  const res = await apiCall<{ request: { id: string } }>(
                    "/api/ipd/requests",
                    "POST",
                    payload
                  );
                  if (res?.request) {
                    setNotice({
                      type: "success",
                      text: `Admission request ${res.request.id} submitted.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onReviewRequest={async (payload) => {
                  const res = await apiCall<{
                    request: { id: string; status: string };
                  }>("/api/ipd/requests", "PATCH", payload);
                  if (res?.request) {
                    setNotice({
                      type: "success",
                      text: `Request ${res.request.id} marked ${res.request.status}.`,
                    });
                  }
                }}
                onConvertToAdmission={(request) => {
                  setConvertingRequest(request);
                  setActiveTab("admission");
                }}
              />
            )}

            {activeTab === "discharge" && (
              <DischargeManagementSection
                admissions={db.admissions}
                discharges={db.discharges}
                preselectedAdmissionId={handoffAdmissionId}
                canRequest={hasIpdPermission(role, "discharge:request")}
                canApprove={hasIpdPermission(role, "discharge:approve")}
                onCreateDischarge={async (payload) => {
                  const res = await apiCall<{ discharge: { id: string } }>(
                    "/api/ipd/discharges",
                    "POST",
                    payload
                  );
                  if (res?.discharge) {
                    setNotice({
                      type: "success",
                      text: `Discharge request ${res.discharge.id} created.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onUpdateDischarge={async (payload) => {
                  const res = await apiCall<{
                    discharge: { id: string; status: string };
                  }>("/api/ipd/discharges", "PATCH", payload);
                  if (res?.discharge) {
                    setNotice({
                      type: "success",
                      text:
                        res.discharge.status === "Completed"
                          ? `Discharge ${res.discharge.id} completed and bed released to Available.`
                          : `Approvals updated for discharge ${res.discharge.id}.`,
                    });
                  }
                }}
                onOpenSummary={(admissionId) => {
                  setHandoffAdmissionId(admissionId);
                  setActiveTab("summary");
                }}
              />
            )}

            {activeTab === "transfers" && (
              <PatientTransfersSection
                admissions={db.admissions}
                beds={db.beds}
                doctors={db.doctors}
                transfers={db.transfers}
                preselectedAdmissionId={handoffAdmissionId}
                canWrite={hasIpdPermission(role, "transfer:write")}
                onCreateTransfer={async (payload) => {
                  const res = await apiCall<{ transfer: { id: string } }>(
                    "/api/ipd/transfers",
                    "POST",
                    payload
                  );
                  if (res?.transfer) {
                    setNotice({
                      type: "success",
                      text: `Transfer ${res.transfer.id} completed and bed assignments updated.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "progress" && (
              <DailyProgressNotesSection
                admissions={db.admissions}
                progressNotes={db.progressNotes}
                preselectedAdmissionId={handoffAdmissionId}
                canWrite={hasIpdPermission(role, "progress:write")}
                onCreateNote={async (payload) => {
                  const res = await apiCall<{ note: { id: string } }>(
                    "/api/ipd/progress-notes",
                    "POST",
                    payload
                  );
                  if (res?.note) {
                    setNotice({
                      type: "success",
                      text: `Progress note ${res.note.id} appended to inpatient chart.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "treatment" && (
              <TreatmentPlansSection
                admissions={db.admissions}
                doctors={db.doctors}
                treatmentPlans={db.treatmentPlans}
                preselectedAdmissionId={handoffAdmissionId}
                canWrite={hasIpdPermission(role, "treatment:write")}
                onCreatePlan={async (payload) => {
                  const res = await apiCall<{
                    plan: { id: string; version: number };
                  }>("/api/ipd/treatment-plans", "POST", payload);
                  if (res?.plan) {
                    setNotice({
                      type: "success",
                      text: `Treatment plan ${res.plan.id} (v${res.plan.version}) saved.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onUpdateStatus={async (planId, status) => {
                  const res = await apiCall<{ plan: { id: string } }>(
                    "/api/ipd/treatment-plans",
                    "PATCH",
                    { planId, status }
                  );
                  if (res?.plan) {
                    setNotice({
                      type: "success",
                      text: `Treatment plan ${planId} status updated to ${status}.`,
                    });
                  }
                }}
              />
            )}

            {activeTab === "summary" && (
              <DischargeSummariesSection
                admissions={db.admissions}
                doctors={db.doctors}
                summaries={db.dischargeSummaries}
                preselectedAdmissionId={handoffAdmissionId}
                canWrite={hasIpdPermission(role, "summary:write")}
                onSaveSummary={async (payload) => {
                  const res = await apiCall<{ summary: { id: string } }>(
                    "/api/ipd/discharge-summaries",
                    "POST",
                    payload
                  );
                  if (res?.summary) {
                    setNotice({
                      type: "success",
                      text: `Discharge summary ${res.summary.id} saved and linked to admission.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
