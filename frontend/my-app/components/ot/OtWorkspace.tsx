"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { hasOtPermission, OT_ROLES } from "@/lib/ot/permissions";
import type { OtRole, OtState } from "@/lib/ot/types";
import { AnesthesiaRecordsSection } from "./AnesthesiaRecordsSection";
import { OtAvailabilitySection } from "./OtAvailabilitySection";
import { PostOpMonitoringSection } from "./PostOpMonitoringSection";
import { PreOpChecklistSection } from "./PreOpChecklistSection";
import { SurgeonAssignmentSection } from "./SurgeonAssignmentSection";
import { SurgerySchedulingSection } from "./SurgerySchedulingSection";
import { SurgicalRecordsSection } from "./SurgicalRecordsSection";

type OtTab =
  | "scheduling"
  | "availability"
  | "surgeons"
  | "checklist"
  | "surgical"
  | "anesthesia"
  | "postop";

const OT_TABS: { id: OtTab; label: string; step: number }[] = [
  { id: "scheduling", label: "Surgery Scheduling", step: 1 },
  { id: "availability", label: "OT Availability", step: 2 },
  { id: "surgeons", label: "Surgeon Assignment", step: 3 },
  { id: "checklist", label: "Pre-Op Checklist", step: 4 },
  { id: "surgical", label: "Surgical Records", step: 5 },
  { id: "anesthesia", label: "Anesthesia Records", step: 6 },
  { id: "postop", label: "Post-Op Monitoring", step: 7 },
];

export function OtWorkspace() {
  const [role, setRole] = useState<OtRole>("OT Manager");
  const [activeTab, setActiveTab] = useState<OtTab>("scheduling");
  const [db, setDb] = useState<OtState | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffSurgeryId, setHandoffSurgeryId] = useState<string | undefined>(
    undefined
  );
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(apiUrl("/api/ot/state"), {
          headers: { "x-ot-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Failed to load OT Management data.",
          });
          return;
        }
        setDb(data as OtState);
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
    const res = await fetch(apiUrl("/api/ot/state"), {
      headers: { "x-ot-role": role },
      cache: "no-store",
    });
    if (res.ok) {
      setDb((await res.json()) as OtState);
    }
  }, [role]);

  const apiCall = useCallback(
    async <T,>(
      url: string,
      method: "POST" | "PATCH" | "DELETE",
      body?: unknown
    ): Promise<T | null> => {
      try {
        const res = await fetch(apiUrl(url), {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-ot-role": role,
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const data = await res.json();
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "OT operation failed.",
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
      return {
        activeSurgeries: 0,
        availableTheatres: 0,
        pendingChecklists: 0,
        completedSurgeries: 0,
      };
    }
    return {
      activeSurgeries: db.surgeries.filter(
        (s) => s.status !== "Completed" && s.status !== "Cancelled"
      ).length,
      availableTheatres: db.theatres.filter((t) => t.status === "Available")
        .length,
      pendingChecklists: db.checklists.filter((c) => c.status !== "Verified")
        .length,
      completedSurgeries: db.surgeries.filter((s) => s.status === "Completed")
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
                <rect x="16" y="3" width="4" height="17" rx="2" fill="#EB9B52" />
              </svg>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#181C1E] px-5 py-2.5 text-sm font-semibold text-white">
              Operation Theatre Management
            </span>

            <span className="inline-flex items-center rounded-full bg-[#EFF3F4] px-3.5 py-2 text-xs font-medium text-[#5A686E] ring-1 ring-white/75">
              Module 06 • Scheduling, Pre-Op, Surgery, Anesthesia &amp; PACU
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="ot-role-select"
              className="text-xs font-semibold text-[#526167]"
            >
              Active Role:
            </label>
            <select
              id="ot-role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as OtRole);
                setNotice(null);
              }}
              className="rounded-full border border-white bg-[#F5F8F9] px-4 py-2 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {OT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Live OT KPI Strip */}
        <section
          aria-label="OT Live Summary"
          className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {[
            {
              label: "Active Scheduled Surgeries",
              value: String(summary.activeSurgeries),
              badge: "Schedule",
              tone: "bg-[#8FC1CE]",
            },
            {
              label: "Available OT Suites",
              value: String(summary.availableTheatres),
              badge: "Ready",
              tone: "bg-[#6AB4A4]",
            },
            {
              label: "Pending Pre-Op Checklists",
              value: String(summary.pendingChecklists),
              badge: "Verify",
              tone: "bg-[#EB9B52]",
            },
            {
              label: "Completed Surgeries",
              value: String(summary.completedSurgeries),
              badge: "Done",
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
          aria-label="Operation Theatre Workflows"
          className="mb-6 flex flex-wrap gap-2 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2.5"
        >
          {OT_TABS.map((tab) => {
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

        {/* Feedback Banner */}
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

        {/* Active Workflow Panel */}
        {loading || !db ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-10 text-center text-sm text-[#6B7A80]">
            Loading Operation Theatre Management workflows...
          </div>
        ) : (
          <main>
            {activeTab === "scheduling" && (
              <SurgerySchedulingSection
                patients={db.patients}
                theatres={db.theatres}
                surgeries={db.surgeries}
                canSchedule={hasOtPermission(role, "ot:schedule")}
                onCreateSurgery={async (payload) => {
                  const res = await apiCall<{ surgery: { id: string } }>(
                    "/api/ot/surgeries",
                    "POST",
                    payload
                  );
                  if (res?.surgery) {
                    setNotice({
                      type: "success",
                      text: `Surgery ${res.surgery.id} scheduled and linked Pre-Op Checklist created.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onUpdateSurgery={async (payload) => {
                  const res = await apiCall<{
                    surgery: { id: string; status: string };
                  }>("/api/ot/surgeries", "PATCH", payload);
                  if (res?.surgery) {
                    setNotice({
                      type: "success",
                      text: `Surgery ${res.surgery.id} updated (${res.surgery.status}).`,
                    });
                    return true;
                  }
                  return false;
                }}
                onNavigateSurgery={(tab, surgeryId) => {
                  setHandoffSurgeryId(surgeryId);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === "availability" && (
              <OtAvailabilitySection
                theatres={db.theatres}
                surgeries={db.surgeries}
                canUpdateStatus={hasOtPermission(role, "ot:theatre:status")}
                onUpdateTheatreStatus={async (theatreId, status) => {
                  const res = await apiCall<{
                    theatre: { name: string; status: string };
                  }>("/api/ot/theatres", "PATCH", { theatreId, status });
                  if (res?.theatre) {
                    setNotice({
                      type: "success",
                      text: `${res.theatre.name} updated to ${res.theatre.status}.`,
                    });
                  }
                }}
              />
            )}

            {activeTab === "surgeons" && (
              <SurgeonAssignmentSection
                surgeries={db.surgeries}
                surgeons={db.surgeons}
                assignments={db.assignments}
                preselectedSurgeryId={handoffSurgeryId}
                canAssign={hasOtPermission(role, "ot:assign")}
                onAssign={async (payload) => {
                  const res = await apiCall<{
                    assignment: { surgeonName: string; assignedRole: string };
                  }>("/api/ot/assignments", "POST", payload);
                  if (res?.assignment) {
                    setNotice({
                      type: "success",
                      text: `Assigned ${res.assignment.surgeonName} as ${res.assignment.assignedRole}.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onRemove={async (assignmentId) => {
                  const res = await apiCall(
                    `/api/ot/assignments/${assignmentId}`,
                    "DELETE"
                  );
                  if (res) {
                    setNotice({
                      type: "success",
                      text: `Removed surgeon assignment ${assignmentId}.`,
                    });
                  }
                }}
              />
            )}

            {activeTab === "checklist" && (
              <PreOpChecklistSection
                surgeries={db.surgeries}
                checklists={db.checklists}
                preselectedSurgeryId={handoffSurgeryId}
                canEdit={hasOtPermission(role, "ot:checklist")}
                onSaveChecklist={async (payload) => {
                  const res = await apiCall<{
                    checklist: { id: string; status: string };
                  }>("/api/ot/checklists", "POST", payload);
                  if (res?.checklist) {
                    setNotice({
                      type: "success",
                      text: `Pre-Op Checklist ${res.checklist.id} saved (${res.checklist.status}).`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "surgical" && (
              <SurgicalRecordsSection
                surgeries={db.surgeries}
                surgeons={db.surgeons}
                surgicalRecords={db.surgicalRecords}
                preselectedSurgeryId={handoffSurgeryId}
                canWrite={hasOtPermission(role, "ot:surgical:write")}
                onSaveRecord={async (payload) => {
                  const res = await apiCall<{ record: { id: string } }>(
                    "/api/ot/surgical-records",
                    "POST",
                    payload
                  );
                  if (res?.record) {
                    setNotice({
                      type: "success",
                      text: `Operative record ${res.record.id} saved; surgery Completed and OT moved to Cleaning.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "anesthesia" && (
              <AnesthesiaRecordsSection
                surgeries={db.surgeries}
                surgeons={db.surgeons}
                anesthesiaRecords={db.anesthesiaRecords}
                preselectedSurgeryId={handoffSurgeryId}
                canWrite={hasOtPermission(role, "ot:anesthesia:write")}
                onSaveRecord={async (payload) => {
                  const res = await apiCall<{ record: { id: string } }>(
                    "/api/ot/anesthesia-records",
                    "POST",
                    payload
                  );
                  if (res?.record) {
                    setNotice({
                      type: "success",
                      text: `Anesthesia record ${res.record.id} saved.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "postop" && (
              <PostOpMonitoringSection
                surgeries={db.surgeries}
                postOpRecords={db.postOpRecords}
                preselectedSurgeryId={handoffSurgeryId}
                canWrite={hasOtPermission(role, "ot:postop:write")}
                onCreatePostOp={async (payload) => {
                  const res = await apiCall<{ record: { id: string } }>(
                    "/api/ot/postop",
                    "POST",
                    payload
                  );
                  if (res?.record) {
                    setNotice({
                      type: "success",
                      text: `Post-op monitoring record ${res.record.id} logged.`,
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
