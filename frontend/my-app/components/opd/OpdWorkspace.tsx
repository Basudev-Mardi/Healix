"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { hasOpdPermission, OPD_ROLES } from "@/lib/opd/permissions";
import type {
  ConsultationStatus,
  FollowUpStatus,
  Gender,
  OpdConsultation,
  OpdDatabase,
  OpdPatient,
  OpdRole,
  PriorityLevel,
} from "@/lib/opd/types";
import { AppointmentSchedulingSection } from "./AppointmentSchedulingSection";
import { ConsultationHistorySection } from "./ConsultationHistorySection";
import { DoctorConsultationSection } from "./DoctorConsultationSection";
import { FollowUpVisitsSection } from "./FollowUpVisitsSection";
import { PatientRegistrationSection } from "./PatientRegistrationSection";
import { QueueManagementSection } from "./QueueManagementSection";
import { TokenGenerationSection } from "./TokenGenerationSection";
import { WalkInManagementSection } from "./WalkInManagementSection";

type OpdTab =
  | "registration"
  | "appointments"
  | "walkins"
  | "tokens"
  | "queue"
  | "consultation"
  | "followups"
  | "history";

const WORKFLOW_TABS: { id: OpdTab; label: string; step: number }[] = [
  { id: "registration", label: "Patient Registration", step: 1 },
  { id: "appointments", label: "Appointments", step: 2 },
  { id: "walkins", label: "Walk-ins", step: 3 },
  { id: "tokens", label: "Token Generation", step: 4 },
  { id: "queue", label: "Queue Management", step: 5 },
  { id: "consultation", label: "Doctor Consultation", step: 6 },
  { id: "followups", label: "Follow-up Visits", step: 7 },
  { id: "history", label: "Consultation History", step: 8 },
];

export function OpdWorkspace() {
  const [role, setRole] = useState<OpdRole>("Super Admin");
  const [activeTab, setActiveTab] = useState<OpdTab>("registration");
  const [db, setDb] = useState<OpdDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Cross-workflow handoff state
  const [handoffPatientId, setHandoffPatientId] = useState<string | undefined>(
    undefined
  );
  const [handoffTokenId, setHandoffTokenId] = useState<string | undefined>(
    undefined
  );
  const [handoffConsultationId, setHandoffConsultationId] = useState<
    string | undefined
  >(undefined);

  const showNotice = useCallback((type: "success" | "error", text: string) => {
    setNotice({ type, text });
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/opd/state", {
        headers: { "x-opd-role": role },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice("error", data.error || "Failed to load OPD data.");
        return;
      }
      setDb(data as OpdDatabase);
    } catch {
      showNotice("error", "Unable to reach OPD server.");
    } finally {
      setLoading(false);
    }
  }, [role, showNotice]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/opd/state", {
          headers: { "x-opd-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Failed to load OPD data.",
          });
          return;
        }
        setDb(data as OpdDatabase);
      } catch {
        if (!cancelled) {
          setNotice({ type: "error", text: "Unable to reach OPD server." });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
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
            "x-opd-role": role,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          showNotice("error", data.error || "Operation failed.");
          return null;
        }
        await fetchState();
        return data as T;
      } catch {
        showNotice("error", "Network error while saving OPD record.");
        return null;
      }
    },
    [role, fetchState, showNotice]
  );

  // Workflow 1: Patient Registration
  const handleRegisterPatient = async (payload: {
    fullName: string;
    dateOfBirth: string;
    gender: Gender;
    phone: string;
    email: string;
    address: string;
    bloodGroup: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies: string;
  }): Promise<OpdPatient | null> => {
    const res = await apiCall<{ patient: OpdPatient }>(
      "/api/opd/patients",
      "POST",
      payload
    );
    if (res?.patient) {
      showNotice(
        "success",
        `Registered ${res.patient.fullName} with unique ID ${res.patient.id}.`
      );
      return res.patient;
    }
    return null;
  };

  // Workflow 2: Appointment Scheduling
  const handleCreateAppointment = async (payload: {
    patientId: string;
    department: string;
    doctorId: string;
    date: string;
    timeSlot: string;
    priority: PriorityLevel;
    reason: string;
  }): Promise<boolean> => {
    const res = await apiCall<{ appointment: { id: string } }>(
      "/api/opd/appointments",
      "POST",
      payload
    );
    if (res?.appointment) {
      showNotice(
        "success",
        `Appointment ${res.appointment.id} scheduled for ${payload.date} at ${payload.timeSlot}.`
      );
      return true;
    }
    return false;
  };

  const handleUpdateAppointment = async (payload: {
    appointmentId: string;
    action: "reschedule" | "cancel";
    date?: string;
    timeSlot?: string;
    doctorId?: string;
    cancelReason?: string;
  }): Promise<boolean> => {
    const res = await apiCall<{ appointment: { id: string; status: string } }>(
      "/api/opd/appointments",
      "PATCH",
      payload
    );
    if (res?.appointment) {
      showNotice(
        "success",
        `Appointment ${res.appointment.id} updated to ${res.appointment.status}.`
      );
      return true;
    }
    return false;
  };

  // Workflow 3: Walk-in Management
  const handleRegisterWalkIn = async (payload: {
    existingPatientId?: string;
    newPatient?: {
      fullName: string;
      dateOfBirth: string;
      gender: Gender;
      phone: string;
      bloodGroup: string;
      allergies: string;
    };
    department: string;
    doctorId: string;
    priority: PriorityLevel;
    reason: string;
  }): Promise<boolean> => {
    const res = await apiCall<{
      patient: { id: string; fullName: string };
      token: { tokenNumber: string };
    }>("/api/opd/walk-ins", "POST", payload);
    if (res?.token) {
      showNotice(
        "success",
        `Walk-in registered for ${res.patient.fullName} (${res.patient.id}) — Token ${res.token.tokenNumber} added to queue.`
      );
      return true;
    }
    return false;
  };

  // Workflow 4: Token Generation
  const handleGenerateToken = async (
    appointmentId: string,
    priority?: PriorityLevel
  ): Promise<void> => {
    const res = await apiCall<{ token: { tokenNumber: string } }>(
      "/api/opd/tokens",
      "POST",
      { appointmentId, priority }
    );
    if (res?.token) {
      showNotice(
        "success",
        `Token ${res.token.tokenNumber} generated for appointment ${appointmentId} and added to queue.`
      );
    }
  };

  // Workflow 5: Queue Management
  const handleQueueAction = async (payload: {
    action: "call-next" | "call" | "start" | "skip" | "requeue" | "complete";
    tokenId?: string;
    doctorId?: string;
  }): Promise<void> => {
    const res = await apiCall<{
      token: { tokenNumber: string; status: string };
    }>("/api/opd/queue", "PATCH", payload);
    if (res?.token) {
      showNotice(
        "success",
        `Token ${res.token.tokenNumber} moved to ${res.token.status}.`
      );
    }
  };

  // Workflow 6: Doctor Consultation
  const handleSaveConsultation = async (payload: {
    tokenId: string;
    vitals: {
      bloodPressure: string;
      temperature: string;
      pulse: string;
      spo2: string;
    };
    symptoms: string;
    observations: string;
    diagnosis: string;
    clinicalNotes: string;
    treatment: string;
    status: ConsultationStatus;
  }): Promise<OpdConsultation | null> => {
    const res = await apiCall<{ consultation: OpdConsultation }>(
      "/api/opd/consultations",
      "POST",
      payload
    );
    if (res?.consultation) {
      showNotice(
        "success",
        `Consultation ${res.consultation.id} saved (${res.consultation.status}).`
      );
      return res.consultation;
    }
    return null;
  };

  // Workflow 7: Follow-up Visits
  const handleScheduleFollowUp = async (payload: {
    originalConsultationId: string;
    scheduledDate: string;
    timeSlot: string;
    doctorId: string;
    instructions: string;
  }): Promise<boolean> => {
    const res = await apiCall<{
      followUp: { id: string };
      appointment: { id: string };
    }>("/api/opd/follow-ups", "POST", payload);
    if (res?.followUp) {
      showNotice(
        "success",
        `Follow-up ${res.followUp.id} scheduled (Appointment ${res.appointment.id}).`
      );
      return true;
    }
    return false;
  };

  const handleUpdateFollowUpStatus = async (
    followUpId: string,
    status: FollowUpStatus
  ): Promise<void> => {
    const res = await apiCall<{ followUp: { id: string; status: string } }>(
      "/api/opd/follow-ups",
      "PATCH",
      { followUpId, status }
    );
    if (res?.followUp) {
      showNotice(
        "success",
        `Follow-up ${res.followUp.id} updated to ${res.followUp.status}.`
      );
    }
  };

  const metrics = useMemo(() => {
    if (!db) {
      return {
        patients: 0,
        activeAppointments: 0,
        waitingQueue: 0,
        completedConsultations: 0,
      };
    }
    return {
      patients: db.patients.length,
      activeAppointments: db.appointments.filter(
        (a) => a.status !== "Cancelled" && a.status !== "Completed"
      ).length,
      waitingQueue: db.tokens.filter(
        (t) =>
          t.status === "Waiting" ||
          t.status === "Called" ||
          t.status === "In Consultation"
      ).length,
      completedConsultations: db.consultations.filter(
        (c) => c.status === "Completed"
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
                <rect x="4" y="10" width="4" height="10" rx="2" fill="#181C1E" />
                <rect x="10" y="6" width="4" height="14" rx="2" fill="#4A90A4" />
                <rect x="16" y="3" width="4" height="17" rx="2" fill="#8FC1CE" />
              </svg>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#181C1E] px-5 py-2.5 text-sm font-semibold text-white">
              OPD Management
            </span>

            <span className="inline-flex items-center rounded-full bg-[#EFF3F4] px-3.5 py-2 text-xs font-medium text-[#5A686E] ring-1 ring-white/75">
              End-to-End Outpatient Workflow
            </span>
          </div>

          {/* RBAC Role Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="opd-role-select"
              className="text-xs font-semibold text-[#526167]"
            >
              Active Role:
            </label>
            <select
              id="opd-role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as OpdRole);
                setNotice(null);
              }}
              className="rounded-full border border-white bg-[#F5F8F9] px-4 py-2 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {OPD_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Summary KPI Strip */}
        <section
          aria-label="OPD Live Summary"
          className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {[
            {
              label: "Registered Patients",
              value: String(metrics.patients),
              badge: "Directory",
              tone: "bg-[#8FC1CE]",
            },
            {
              label: "Active Appointments",
              value: String(metrics.activeAppointments),
              badge: "Scheduled",
              tone: "bg-[#4A90A4]",
            },
            {
              label: "Live OPD Queue",
              value: String(metrics.waitingQueue),
              badge: "In Flow",
              tone: "bg-[#EB9B52]",
            },
            {
              label: "Completed Consultations",
              value: String(metrics.completedConsultations),
              badge: "Recorded",
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

        {/* Continuous 8-Step OPD Workflow Tabs */}
        <nav
          aria-label="OPD Workflows"
          className="mb-6 flex flex-wrap gap-2 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2.5"
        >
          {WORKFLOW_TABS.map((tab) => {
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

        {/* Active Workflow Workspace */}
        {loading || !db ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-10 text-center text-sm text-[#6B7A80]">
            Loading OPD Management workflows...
          </div>
        ) : (
          <main>
            {activeTab === "registration" && (
              <PatientRegistrationSection
                patients={db.patients}
                canWrite={hasOpdPermission(role, "patient:write")}
                onRegister={handleRegisterPatient}
                onStartAppointment={(patientId) => {
                  setHandoffPatientId(patientId);
                  setActiveTab("appointments");
                }}
                onStartWalkIn={(patientId) => {
                  setHandoffPatientId(patientId);
                  setActiveTab("walkins");
                }}
                onViewHistory={(patientId) => {
                  setHandoffPatientId(patientId);
                  setActiveTab("history");
                }}
              />
            )}

            {activeTab === "appointments" && (
              <AppointmentSchedulingSection
                patients={db.patients}
                doctors={db.doctors}
                appointments={db.appointments}
                preselectedPatientId={handoffPatientId}
                canWrite={hasOpdPermission(role, "appointment:write")}
                canGenerateToken={hasOpdPermission(role, "token:write")}
                onCreateAppointment={handleCreateAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onGenerateToken={handleGenerateToken}
              />
            )}

            {activeTab === "walkins" && (
              <WalkInManagementSection
                patients={db.patients}
                doctors={db.doctors}
                tokens={db.tokens}
                preselectedPatientId={handoffPatientId}
                canWrite={hasOpdPermission(role, "walkin:write")}
                onRegisterWalkIn={handleRegisterWalkIn}
              />
            )}

            {activeTab === "tokens" && (
              <TokenGenerationSection
                appointments={db.appointments}
                tokens={db.tokens}
                patients={db.patients}
                doctors={db.doctors}
                canWrite={hasOpdPermission(role, "token:write")}
                onGenerateToken={handleGenerateToken}
              />
            )}

            {activeTab === "queue" && (
              <QueueManagementSection
                tokens={db.tokens}
                patients={db.patients}
                doctors={db.doctors}
                canManage={hasOpdPermission(role, "queue:manage")}
                canConsult={hasOpdPermission(role, "consultation:read")}
                onQueueAction={handleQueueAction}
                onOpenConsultation={(tokenId) => {
                  setHandoffTokenId(tokenId);
                  setActiveTab("consultation");
                }}
              />
            )}

            {activeTab === "consultation" && (
              <DoctorConsultationSection
                doctors={db.doctors}
                patients={db.patients}
                appointments={db.appointments}
                tokens={db.tokens}
                consultations={db.consultations}
                preselectedTokenId={handoffTokenId}
                canWrite={hasOpdPermission(role, "consultation:write")}
                onSaveConsultation={handleSaveConsultation}
                onScheduleFollowUp={(consultationId) => {
                  setHandoffConsultationId(consultationId);
                  setActiveTab("followups");
                }}
              />
            )}

            {activeTab === "followups" && (
              <FollowUpVisitsSection
                consultations={db.consultations}
                followUps={db.followUps}
                appointments={db.appointments}
                patients={db.patients}
                doctors={db.doctors}
                preselectedConsultationId={handoffConsultationId}
                canWrite={hasOpdPermission(role, "followup:write")}
                canGenerateToken={hasOpdPermission(role, "token:write")}
                onScheduleFollowUp={handleScheduleFollowUp}
                onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
                onCheckInFollowUp={handleGenerateToken}
              />
            )}

            {activeTab === "history" && (
              <ConsultationHistorySection
                consultations={db.consultations}
                patients={db.patients}
                doctors={db.doctors}
                followUps={db.followUps}
                preselectedPatientId={handoffPatientId}
                canRead={hasOpdPermission(role, "history:read")}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
