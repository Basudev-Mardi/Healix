"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMERGENCY_ROLES,
  hasEmergencyPermission,
} from "@/lib/emergency/permissions";
import type {
  AlertSeverity,
  ArrivalMode,
  CriticalAlert,
  EmergencyDatabase,
  EmergencyQueueStatus,
  EmergencyRegistration,
  EmergencyRole,
  EmergencyType,
  Gender,
  TransferDestination,
  TransferStatus,
  TraumaInjuryType,
  TraumaProgressStatus,
  TraumaSeverity,
  TreatmentStatus,
  TriageLevel,
} from "@/lib/emergency/types";
import { CriticalAlertsSection } from "./CriticalAlertsSection";
import { EmergencyQueueSection } from "./EmergencyQueueSection";
import { EmergencyRegistrationSection } from "./EmergencyRegistrationSection";
import { TransferManagementSection } from "./TransferManagementSection";
import { TraumaManagementSection } from "./TraumaManagementSection";
import { TreatmentRecordsSection } from "./TreatmentRecordsSection";
import { TriageAssessmentSection } from "./TriageAssessmentSection";

type EmergencyTab =
  | "registration"
  | "triage"
  | "queue"
  | "trauma"
  | "treatment"
  | "alerts"
  | "transfers";

const EMERGENCY_TABS: { id: EmergencyTab; label: string; step: number }[] = [
  { id: "registration", label: "Emergency Registration", step: 1 },
  { id: "triage", label: "Triage Assessment", step: 2 },
  { id: "queue", label: "Emergency Queue", step: 3 },
  { id: "trauma", label: "Trauma Management", step: 4 },
  { id: "treatment", label: "Treatment Records", step: 5 },
  { id: "alerts", label: "Critical Alerts", step: 6 },
  { id: "transfers", label: "Transfer Management", step: 7 },
];

export function EmergencyWorkspace() {
  const [role, setRole] = useState<EmergencyRole>("Emergency Staff");
  const [activeTab, setActiveTab] = useState<EmergencyTab>("queue");
  const [db, setDb] = useState<EmergencyDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffEmergencyId, setHandoffEmergencyId] = useState<
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
        const res = await fetch("/api/emergency/state", {
          headers: { "x-emergency-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Failed to load Emergency Management data.",
          });
          return;
        }
        setDb(data as EmergencyDatabase);
      } catch {
        if (!cancelled) {
          setNotice({
            type: "error",
            text: "Unable to reach Emergency Management server.",
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
    const res = await fetch("/api/emergency/state", {
      headers: { "x-emergency-role": role },
      cache: "no-store",
    });
    if (res.ok) {
      setDb((await res.json()) as EmergencyDatabase);
    }
  }, [role]);

  const apiCall = useCallback(
    async <T,>(
      url: string,
      method: "POST" | "PATCH",
      body: unknown
    ): Promise<T | null> => {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-emergency-role": role,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Emergency action failed.",
          });
          return null;
        }
        await refreshState();
        return data as T;
      } catch {
        setNotice({
          type: "error",
          text: "Network error communicating with Emergency Management API.",
        });
        return null;
      }
    },
    [role, refreshState]
  );

  // 1. Emergency Registration
  const handleRegister = async (payload: {
    mode: "existing" | "new" | "unknown";
    existingPatientId?: string;
    newPatient?: {
      fullName: string;
      ageOrDob: string;
      gender: Gender;
      phone: string;
      bloodGroup: string;
      allergies: string;
    };
    unknownPatient?: {
      alias: string;
      estimatedAge: string;
      gender: Gender;
      distinguishingMarks: string;
    };
    arrivalTime: string;
    arrivalMode: ArrivalMode;
    emergencyType: EmergencyType;
    presentingComplaints: string;
    assignedBay: string;
  }): Promise<EmergencyRegistration | null> => {
    const res = await apiCall<{ registration: EmergencyRegistration }>(
      "/api/emergency/registrations",
      "POST",
      payload
    );
    if (res?.registration) {
      setNotice({
        type: "success",
        text: `Emergency case ${res.registration.id} registered for ${res.registration.patientName} (${res.registration.patientId}).`,
      });
      return res.registration;
    }
    return null;
  };

  // 2. Triage Assessment
  const handleSaveTriage = async (payload: {
    emergencyId: string;
    triageLevel: TriageLevel;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      respiratoryRate: string;
      spo2: string;
      temperature: string;
      gcsScore: string;
      painScore: string;
    };
    symptoms: string;
    severitySummary: string;
    assessmentNotes: string;
  }): Promise<boolean> => {
    const res = await apiCall<{ autoAlert?: CriticalAlert }>(
      "/api/emergency/triage",
      "POST",
      payload
    );
    if (res) {
      setNotice({
        type: "success",
        text: res.autoAlert
          ? `Triage saved (${payload.triageLevel}) — Critical Alert ${res.autoAlert.id} automatically triggered!`
          : `Triage assessment saved for ${payload.emergencyId} (${payload.triageLevel}).`,
      });
      return true;
    }
    return false;
  };

  // 3. Emergency Queue
  const handleUpdateQueueStatus = async (
    emergencyId: string,
    queueStatus: EmergencyQueueStatus
  ): Promise<void> => {
    const res = await apiCall<{ registration: EmergencyRegistration }>(
      "/api/emergency/queue",
      "PATCH",
      { emergencyId, queueStatus }
    );
    if (res?.registration) {
      setNotice({
        type: "success",
        text: `Case ${emergencyId} moved to ${queueStatus}.`,
      });
    }
  };

  // 4. Trauma Management
  const handleSaveTrauma = async (payload: {
    emergencyId: string;
    injuryType: TraumaInjuryType;
    severity: TraumaSeverity;
    mechanismOfInjury: string;
    affectedBodyAreas: string[];
    airwayStatus: string;
    bleedingControl: string;
    assessmentNotes: string;
    treatmentProgress: TraumaProgressStatus;
  }): Promise<boolean> => {
    const res = await apiCall<{ trauma: { id: string } }>(
      "/api/emergency/trauma",
      "POST",
      payload
    );
    if (res?.trauma) {
      setNotice({
        type: "success",
        text: `Trauma record ${res.trauma.id} documented for ${payload.emergencyId}.`,
      });
      return true;
    }
    return false;
  };

  const handleUpdateTraumaProgress = async (
    traumaId: string,
    treatmentProgress: TraumaProgressStatus
  ): Promise<void> => {
    const res = await apiCall<{ trauma: { id: string } }>(
      "/api/emergency/trauma",
      "PATCH",
      { traumaId, treatmentProgress }
    );
    if (res?.trauma) {
      setNotice({
        type: "success",
        text: `Trauma record ${traumaId} progress updated to ${treatmentProgress}.`,
      });
    }
  };

  // 5. Treatment Records
  const handleCreateTreatment = async (payload: {
    emergencyId: string;
    attendingDoctor: string;
    emergencyStaffInvolved: string;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      spo2: string;
      temperature: string;
    };
    diagnosis: string;
    observations: string;
    treatmentsAndProcedures: string;
    medicationsAdministered: string;
    status: TreatmentStatus;
    outcome: string;
  }): Promise<boolean> => {
    const res = await apiCall<{ treatment: { id: string } }>(
      "/api/emergency/treatments",
      "POST",
      payload
    );
    if (res?.treatment) {
      setNotice({
        type: "success",
        text: `Treatment record ${res.treatment.id} saved (${payload.status}).`,
      });
      return true;
    }
    return false;
  };

  // 6. Critical Alerts
  const handleCreateAlert = async (payload: {
    emergencyId: string;
    alertType: string;
    severity: AlertSeverity;
    conditionSummary: string;
    notifiedGroups: string[];
  }): Promise<boolean> => {
    const res = await apiCall<{ alert: { id: string } }>(
      "/api/emergency/alerts",
      "POST",
      payload
    );
    if (res?.alert) {
      setNotice({
        type: "success",
        text: `Critical Alert ${res.alert.id} broadcast to ${payload.notifiedGroups.join(", ")}.`,
      });
      return true;
    }
    return false;
  };

  const handleUpdateAlert = async (payload: {
    alertId: string;
    action: "acknowledge" | "resolve";
    resolutionNotes?: string;
  }): Promise<void> => {
    const res = await apiCall<{ alert: { id: string; status: string } }>(
      "/api/emergency/alerts",
      "PATCH",
      payload
    );
    if (res?.alert) {
      setNotice({
        type: "success",
        text: `Alert ${res.alert.id} marked ${res.alert.status}.`,
      });
    }
  };

  // 7. Transfer Management
  const handleCreateTransfer = async (payload: {
    emergencyId: string;
    destination: TransferDestination;
    targetBedOrUnit: string;
    reason: string;
    responsibleStaff: string;
    handoverDetails: string;
  }): Promise<boolean> => {
    const res = await apiCall<{ transfer: { id: string } }>(
      "/api/emergency/transfers",
      "POST",
      payload
    );
    if (res?.transfer) {
      setNotice({
        type: "success",
        text: `Transfer request ${res.transfer.id} submitted to ${payload.destination}.`,
      });
      return true;
    }
    return false;
  };

  const handleUpdateTransfer = async (payload: {
    transferId: string;
    status: TransferStatus;
  }): Promise<void> => {
    const res = await apiCall<{ transfer: { id: string; status: string } }>(
      "/api/emergency/transfers",
      "PATCH",
      payload
    );
    if (res?.transfer) {
      setNotice({
        type: "success",
        text: `Transfer ${res.transfer.id} updated to ${res.transfer.status}.`,
      });
    }
  };

  const summary = useMemo(() => {
    if (!db) {
      return {
        activeCases: 0,
        criticalTriage: 0,
        openAlerts: 0,
        pendingTransfers: 0,
      };
    }
    return {
      activeCases: db.registrations.filter(
        (r) => r.queueStatus !== "Completed" && r.queueStatus !== "Transferred"
      ).length,
      criticalTriage: db.registrations.filter(
        (r) =>
          (r.triageLevel === "Level 1 - Resuscitation" ||
            r.triageLevel === "Level 2 - Emergent") &&
          r.queueStatus !== "Completed" &&
          r.queueStatus !== "Transferred"
      ).length,
      openAlerts: db.alerts.filter((a) => a.status !== "Resolved").length,
      pendingTransfers: db.transfers.filter(
        (t) => t.status !== "Completed" && t.status !== "Cancelled"
      ).length,
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
                <rect x="10" y="6" width="4" height="14" rx="2" fill="#181C1E" />
                <rect x="16" y="3" width="4" height="17" rx="2" fill="#8FC1CE" />
              </svg>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#181C1E] px-5 py-2.5 text-sm font-semibold text-white">
              Emergency Management
            </span>

            <span className="inline-flex items-center rounded-full bg-[#EFF3F4] px-3.5 py-2 text-xs font-medium text-[#5A686E] ring-1 ring-white/75">
              Module 02 • Trauma &amp; Acute Care Workflow
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="emergency-role-select"
              className="text-xs font-semibold text-[#526167]"
            >
              Active Role:
            </label>
            <select
              id="emergency-role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as EmergencyRole);
                setNotice(null);
              }}
              className="rounded-full border border-white bg-[#F5F8F9] px-4 py-2 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {EMERGENCY_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Live Emergency KPI Bento Strip */}
        <section
          aria-label="Emergency Department Summary"
          className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {[
            {
              label: "Active ER Cases",
              value: String(summary.activeCases),
              badge: "Live",
              tone: "bg-[#8FC1CE]",
            },
            {
              label: "Critical / Emergent (L1-L2)",
              value: String(summary.criticalTriage),
              badge: "Priority",
              tone: "bg-[#EF5B3A]",
            },
            {
              label: "Open Critical Alerts",
              value: String(summary.openAlerts),
              badge: "Alert",
              tone: "bg-[#EB9B52]",
            },
            {
              label: "Pending Transfers",
              value: String(summary.pendingTransfers),
              badge: "Handover",
              tone: "bg-[#6AB4A4]",
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

        {/* 7-Workflow Continuous Navigation */}
        <nav
          aria-label="Emergency Workflows"
          className="mb-6 flex flex-wrap gap-2 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2.5"
        >
          {EMERGENCY_TABS.map((tab) => {
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
                      ? tab.id === "alerts"
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

        {/* Status Feedback */}
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
            Loading Emergency Management workflows...
          </div>
        ) : (
          <main>
            {activeTab === "registration" && (
              <EmergencyRegistrationSection
                patients={db.patients}
                registrations={db.registrations}
                canWrite={hasEmergencyPermission(role, "registration:write")}
                onRegister={handleRegister}
                onOpenTriage={(emergencyId) => {
                  setHandoffEmergencyId(emergencyId);
                  setActiveTab("triage");
                }}
              />
            )}

            {activeTab === "triage" && (
              <TriageAssessmentSection
                registrations={db.registrations}
                triages={db.triages}
                preselectedEmergencyId={handoffEmergencyId}
                canWrite={hasEmergencyPermission(role, "triage:write")}
                onSaveTriage={handleSaveTriage}
              />
            )}

            {activeTab === "queue" && (
              <EmergencyQueueSection
                registrations={db.registrations}
                canManage={hasEmergencyPermission(role, "queue:manage")}
                onUpdateStatus={handleUpdateQueueStatus}
                onNavigateCase={(tab, emergencyId) => {
                  setHandoffEmergencyId(emergencyId);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === "trauma" && (
              <TraumaManagementSection
                registrations={db.registrations}
                traumas={db.traumas}
                preselectedEmergencyId={handoffEmergencyId}
                canWrite={hasEmergencyPermission(role, "trauma:write")}
                onSaveTrauma={handleSaveTrauma}
                onUpdateProgress={handleUpdateTraumaProgress}
              />
            )}

            {activeTab === "treatment" && (
              <TreatmentRecordsSection
                registrations={db.registrations}
                staff={db.staff}
                treatments={db.treatments}
                preselectedEmergencyId={handoffEmergencyId}
                canWrite={hasEmergencyPermission(role, "treatment:write")}
                onCreateTreatment={handleCreateTreatment}
              />
            )}

            {activeTab === "alerts" && (
              <CriticalAlertsSection
                registrations={db.registrations}
                alerts={db.alerts}
                preselectedEmergencyId={handoffEmergencyId}
                canTrigger={hasEmergencyPermission(role, "alert:write")}
                canAcknowledge={hasEmergencyPermission(
                  role,
                  "alert:acknowledge"
                )}
                onCreateAlert={handleCreateAlert}
                onUpdateAlert={handleUpdateAlert}
              />
            )}

            {activeTab === "transfers" && (
              <TransferManagementSection
                registrations={db.registrations}
                transfers={db.transfers}
                preselectedEmergencyId={handoffEmergencyId}
                canRequest={hasEmergencyPermission(role, "transfer:request")}
                canApprove={hasEmergencyPermission(role, "transfer:approve")}
                onCreateTransfer={handleCreateTransfer}
                onUpdateTransfer={handleUpdateTransfer}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
