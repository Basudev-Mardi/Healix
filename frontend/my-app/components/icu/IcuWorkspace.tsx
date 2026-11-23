"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { hasIcuPermission, ICU_ROLES } from "@/lib/icu/permissions";
import type { IcuRole, IcuState } from "@/lib/icu/types";
import { CriticalCareNotesSection } from "./CriticalCareNotesSection";
import { IcuAdmissionSection } from "./IcuAdmissionSection";
import { IcuDispositionSection } from "./IcuDispositionSection";
import { MedicationAdministrationSection } from "./MedicationAdministrationSection";
import { PatientMonitoringSection } from "./PatientMonitoringSection";
import { VentilatorRecordsSection } from "./VentilatorRecordsSection";
import { VitalSignsSection } from "./VitalSignsSection";

type IcuTab =
  | "admission"
  | "monitoring"
  | "vitals"
  | "notes"
  | "ventilator"
  | "medications"
  | "disposition";

const ICU_TABS: { id: IcuTab; label: string; step: number }[] = [
  { id: "admission", label: "ICU Admission", step: 1 },
  { id: "monitoring", label: "Patient Monitoring", step: 2 },
  { id: "vitals", label: "Vital Signs", step: 3 },
  { id: "notes", label: "Critical Care Notes", step: 4 },
  { id: "ventilator", label: "Ventilator Records", step: 5 },
  { id: "medications", label: "Medication Admin", step: 6 },
  { id: "disposition", label: "Transfer & Discharge", step: 7 },
];

export function IcuWorkspace() {
  const [role, setRole] = useState<IcuRole>("ICU Staff");
  const [activeTab, setActiveTab] = useState<IcuTab>("admission");
  const [db, setDb] = useState<IcuState | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffAdmissionId, setHandoffAdmissionId] = useState<
    string | undefined
  >(undefined);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(apiUrl("/api/icu/state"), {
          headers: { "x-icu-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Failed to load ICU Management data.",
          });
          return;
        }
        setDb(data as IcuState);
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
    const res = await fetch(apiUrl("/api/icu/state"), {
      headers: { "x-icu-role": role },
      cache: "no-store",
    });
    if (res.ok) {
      setDb((await res.json()) as IcuState);
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
            "x-icu-role": role,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "ICU operation failed.",
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
      return { activeIcu: 0, availableBeds: 0, abnormalVitals: 0, pendingMeds: 0 };
    }
    return {
      activeIcu: db.admissions.filter(
        (a) => a.status !== "Transferred" && a.status !== "Discharged"
      ).length,
      availableBeds: db.icuBeds.filter((b) => b.status === "Available").length,
      abnormalVitals: db.vitalSigns.filter((v) => v.isAbnormal).length,
      pendingMeds: db.medications.filter((m) => m.status === "Pending").length,
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
                <rect x="4" y="10" width="4" height="10" rx="2" fill="#EF5B3A" />
                <rect x="10" y="6" width="4" height="14" rx="2" fill="#4A90A4" />
                <rect x="16" y="3" width="4" height="17" rx="2" fill="#181C1E" />
              </svg>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#181C1E] px-5 py-2.5 text-sm font-semibold text-white">
              ICU Management
            </span>

            <span className="inline-flex items-center rounded-full bg-[#EFF3F4] px-3.5 py-2 text-xs font-medium text-[#5A686E] ring-1 ring-white/75">
              Module 05 • Critical Care, Vitals, Ventilator &amp; MAR
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="icu-role-select"
              className="text-xs font-semibold text-[#526167]"
            >
              Active Role:
            </label>
            <select
              id="icu-role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as IcuRole);
                setNotice(null);
              }}
              className="rounded-full border border-white bg-[#F5F8F9] px-4 py-2 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {ICU_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Live ICU KPI Strip */}
        <section
          aria-label="ICU Live Summary"
          className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {[
            {
              label: "Active ICU Patients",
              value: String(summary.activeIcu),
              badge: "Critical Care",
              tone: "bg-[#8FC1CE]",
            },
            {
              label: "Available ICU Beds",
              value: String(summary.availableBeds),
              badge: "Ready",
              tone: "bg-[#6AB4A4]",
            },
            {
              label: "Abnormal Vital Flags",
              value: String(summary.abnormalVitals),
              badge: "Alert",
              tone: "bg-[#EF5B3A]",
            },
            {
              label: "Pending MAR Doses",
              value: String(summary.pendingMeds),
              badge: "Scheduled",
              tone: "bg-[#EB9B52]",
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
          aria-label="ICU Workflows"
          className="mb-6 flex flex-wrap gap-2 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2.5"
        >
          {ICU_TABS.map((tab) => {
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
                      ? tab.id === "vitals"
                        ? "bg-[#EF5B3A] text-white"
                        : "bg-[#8FC1CE] text-[#14191B]"
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
            Loading ICU Management workflows...
          </div>
        ) : (
          <main>
            {activeTab === "admission" && (
              <IcuAdmissionSection
                patients={db.patients}
                doctors={db.doctors}
                icuBeds={db.icuBeds}
                admissions={db.admissions}
                canAdmit={hasIcuPermission(role, "icu:admit")}
                onAdmit={async (payload) => {
                  const res = await apiCall<{
                    admission: { id: string; patientName: string; bedLabel: string };
                  }>("/api/icu/admissions", "POST", payload);
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

            {activeTab === "monitoring" && (
              <PatientMonitoringSection
                admissions={db.admissions}
                monitoringRecords={db.monitoringRecords}
                preselectedAdmissionId={handoffAdmissionId}
                canMonitor={hasIcuPermission(role, "icu:monitor")}
                onCreateMonitoring={async (payload) => {
                  const res = await apiCall<{ record: { id: string } }>(
                    "/api/icu/monitoring",
                    "POST",
                    payload
                  );
                  if (res?.record) {
                    setNotice({
                      type: "success",
                      text: `Monitoring update ${res.record.id} recorded.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "vitals" && (
              <VitalSignsSection
                admissions={db.admissions}
                vitalSigns={db.vitalSigns}
                thresholds={db.vitalThresholds}
                preselectedAdmissionId={handoffAdmissionId}
                canRecordVitals={hasIcuPermission(role, "icu:vitals")}
                canEditThresholds={hasIcuPermission(role, "icu:thresholds")}
                onRecordVitals={async (payload) => {
                  const res = await apiCall<{
                    vital: { id: string; isAbnormal: boolean; abnormalFlags: string[] };
                  }>("/api/icu/vitals", "POST", payload);
                  if (res?.vital) {
                    setNotice({
                      type: res.vital.isAbnormal ? "error" : "success",
                      text: res.vital.isAbnormal
                        ? `Abnormal vitals flagged (${res.vital.id}): ${res.vital.abnormalFlags.join(", ")}`
                        : `Vital signs ${res.vital.id} recorded within normal thresholds.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onUpdateThresholds={async (payload) => {
                  const res = await apiCall<{ thresholds: unknown }>(
                    "/api/icu/thresholds",
                    "PATCH",
                    payload
                  );
                  if (res) {
                    setNotice({
                      type: "success",
                      text: "Clinical vital-sign thresholds updated.",
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "notes" && (
              <CriticalCareNotesSection
                admissions={db.admissions}
                careNotes={db.careNotes}
                preselectedAdmissionId={handoffAdmissionId}
                canWrite={hasIcuPermission(role, "icu:notes")}
                onCreateNote={async (payload) => {
                  const res = await apiCall<{ note: { id: string } }>(
                    "/api/icu/care-notes",
                    "POST",
                    payload
                  );
                  if (res?.note) {
                    setNotice({
                      type: "success",
                      text: `Critical care note ${res.note.id} saved.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "ventilator" && (
              <VentilatorRecordsSection
                admissions={db.admissions}
                ventilatorRecords={db.ventilatorRecords}
                preselectedAdmissionId={handoffAdmissionId}
                canWrite={hasIcuPermission(role, "icu:ventilator")}
                onCreateRecord={async (payload) => {
                  const res = await apiCall<{ record: { id: string } }>(
                    "/api/icu/ventilators",
                    "POST",
                    payload
                  );
                  if (res?.record) {
                    setNotice({
                      type: "success",
                      text: `Ventilator record ${res.record.id} logged.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "medications" && (
              <MedicationAdministrationSection
                admissions={db.admissions}
                medications={db.medications}
                preselectedAdmissionId={handoffAdmissionId}
                canPrescribe={hasIcuPermission(role, "icu:meds:prescribe")}
                canAdminister={hasIcuPermission(role, "icu:meds:administer")}
                onPrescribe={async (payload) => {
                  const res = await apiCall<{ medication: { id: string } }>(
                    "/api/icu/medications",
                    "POST",
                    payload
                  );
                  if (res?.medication) {
                    setNotice({
                      type: "success",
                      text: `Medication order ${res.medication.id} added to ICU MAR.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onAdminister={async (payload) => {
                  const res = await apiCall<{
                    medication: { id: string; status: string };
                  }>("/api/icu/medications", "PATCH", payload);
                  if (res?.medication) {
                    setNotice({
                      type: "success",
                      text: `Medication ${res.medication.id} marked ${res.medication.status}.`,
                    });
                  }
                }}
              />
            )}

            {activeTab === "disposition" && (
              <IcuDispositionSection
                admissions={db.admissions}
                allBeds={db.allBeds}
                doctors={db.doctors}
                dispositions={db.dispositions}
                preselectedAdmissionId={handoffAdmissionId}
                canRequest={hasIcuPermission(role, "icu:disposition:request")}
                canApprove={hasIcuPermission(role, "icu:disposition:approve")}
                onCreateDisposition={async (payload) => {
                  const res = await apiCall<{ disposition: { id: string } }>(
                    "/api/icu/dispositions",
                    "POST",
                    payload
                  );
                  if (res?.disposition) {
                    setNotice({
                      type: "success",
                      text: `ICU ${payload.dispositionType} request ${res.disposition.id} created.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onUpdateDisposition={async (payload) => {
                  const res = await apiCall<{
                    disposition: { id: string; status: string };
                  }>("/api/icu/dispositions", "PATCH", payload);
                  if (res?.disposition) {
                    setNotice({
                      type: "success",
                      text:
                        res.disposition.status === "Completed"
                          ? `Disposition ${res.disposition.id} completed and ICU bed released.`
                          : `Disposition ${res.disposition.id} updated to ${res.disposition.status}.`,
                    });
                  }
                }}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
