"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import {
  hasRadiologyPermission,
  RADIOLOGY_ROLES,
} from "@/lib/radiology/permissions";
import type { RadiologyRole, RadiologyState } from "@/lib/radiology/types";
import { ImageStorageSection } from "./ImageStorageSection";
import { ImagingAppointmentsSection } from "./ImagingAppointmentsSection";
import { ModalitySection } from "./ModalitySection";
import { RadiologistReportsSection } from "./RadiologistReportsSection";

type RadiologyTab =
  | "xray"
  | "ct"
  | "mri"
  | "ultrasound"
  | "appointments"
  | "images"
  | "reports";

const RADIOLOGY_TABS: { id: RadiologyTab; label: string }[] = [
  { id: "xray", label: "1. X-ray" },
  { id: "ct", label: "2. CT Scan" },
  { id: "mri", label: "3. MRI" },
  { id: "ultrasound", label: "4. Ultrasound" },
  { id: "appointments", label: "5. Imaging Appointments" },
  { id: "images", label: "6. Image Storage" },
  { id: "reports", label: "7. Radiologist Reports" },
];

export function RadiologyWorkspace() {
  const [role, setRole] = useState<RadiologyRole>("Radiologist");
  const [activeTab, setActiveTab] = useState<RadiologyTab>("xray");
  const [state, setState] = useState<RadiologyState | null>(null);
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
        const res = await fetch(apiUrl("/api/radiology/state"), {
          headers: { "x-radiology-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load Radiology state.");
        }
        if (!cancelled) {
          setState(data as RadiologyState);
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text:
              err instanceof Error
                ? err.message
                : "Could not reach Radiology API.",
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
    const res = await fetch(apiUrl("/api/radiology/state"), {
      headers: { "x-radiology-role": role },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh Radiology state.");
    }
    setState(data as RadiologyState);
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
          "x-radiology-role": role,
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

  const openExamsCount =
    state?.requests.filter(
      (r) => r.status !== "Completed" && r.status !== "Cancelled"
    ).length ?? 0;
  const activeAppointmentsCount =
    state?.appointments.filter(
      (a) => a.status !== "Completed" && a.status !== "Cancelled"
    ).length ?? 0;
  const storedImagesCount = state?.images.length ?? 0;
  const finalizedReportsCount =
    state?.reports.filter((r) => r.status === "Finalized").length ?? 0;

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Top Header */}
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Module 08 • RIS
              </span>
              <Link
                href="/"
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#47565C] transition hover:bg-[#F8FAFA]"
              >
                ← Back to Hub
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              Radiology Management (RIS)
            </h1>
            <p className="text-xs text-[#6B7A80]">
              End-to-end diagnostic imaging across X-ray, CT Scan, MRI,
              Ultrasound, Imaging Appointments, Secure Image Storage, and
              Radiologist PDF Reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A80]">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as RadiologyRole);
                setBanner(null);
              }}
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {RADIOLOGY_ROLES.map((r) => (
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
              label: "Open Imaging Studies",
              value: openExamsCount,
              accent: "bg-[#8FC1CE]",
            },
            {
              label: "Active Appointments",
              value: activeAppointmentsCount,
              accent: "bg-[#EB9B52]",
            },
            {
              label: "Stored Images (PACS)",
              value: storedImagesCount,
              accent: "bg-[#4A90A4]",
            },
            {
              label: "Finalized Reports",
              value: finalizedReportsCount,
              accent: "bg-[#6AB4A4]",
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
          {RADIOLOGY_TABS.map((tab) => (
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
            Loading Radiology Management workspace...
          </div>
        ) : (
          <>
            {(activeTab === "xray" ||
              activeTab === "ct" ||
              activeTab === "mri" ||
              activeTab === "ultrasound") && (
              <ModalitySection
                key={activeTab}
                modality={
                  activeTab === "xray"
                    ? "X-ray"
                    : activeTab === "ct"
                      ? "CT Scan"
                      : activeTab === "mri"
                        ? "MRI"
                        : "Ultrasound"
                }
                patients={state.patients}
                doctors={state.doctors}
                requests={state.requests}
                appointments={state.appointments}
                images={state.images}
                reports={state.reports}
                canCreate={hasRadiologyPermission(
                  role,
                  "radiology:request:create"
                )}
                canManageExam={hasRadiologyPermission(
                  role,
                  "radiology:exam:manage"
                )}
                onCreateRequest={(payload) =>
                  mutate(
                    "/api/radiology/requests",
                    "POST",
                    payload,
                    `${payload.modality} examination request created.`
                  )
                }
                onUpdateRequest={async (payload) => {
                  await mutate(
                    "/api/radiology/requests",
                    "PATCH",
                    payload,
                    `Examination ${payload.requestId} updated${payload.status ? ` to ${payload.status}` : ""}.`
                  );
                }}
                onNavigateRequest={(tab, requestId) => {
                  setHandoffRequestId(requestId);
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === "appointments" && (
              <ImagingAppointmentsSection
                requests={state.requests}
                equipment={state.equipment}
                appointments={state.appointments}
                preselectedRequestId={handoffRequestId}
                canManage={hasRadiologyPermission(
                  role,
                  "radiology:appointment:manage"
                )}
                onCreateAppointment={(payload) =>
                  mutate(
                    "/api/radiology/appointments",
                    "POST",
                    payload,
                    `Imaging appointment scheduled for ${payload.requestId}.`
                  )
                }
                onUpdateAppointment={async (payload) => {
                  await mutate(
                    "/api/radiology/appointments",
                    "PATCH",
                    payload,
                    payload.action === "cancel"
                      ? `Appointment ${payload.appointmentId} cancelled.`
                      : `Appointment ${payload.appointmentId} rescheduled.`
                  );
                }}
              />
            )}

            {activeTab === "images" && (
              <ImageStorageSection
                requests={state.requests}
                images={state.images}
                preselectedRequestId={handoffRequestId}
                canUpload={hasRadiologyPermission(
                  role,
                  "radiology:image:upload"
                )}
                onUploadImage={(payload) =>
                  mutate(
                    "/api/radiology/images",
                    "POST",
                    payload,
                    `Image "${payload.fileName}" stored for ${payload.requestId}.`
                  )
                }
              />
            )}

            {activeTab === "reports" && (
              <RadiologistReportsSection
                requests={state.requests}
                images={state.images}
                reports={state.reports}
                preselectedRequestId={handoffRequestId}
                canWrite={hasRadiologyPermission(
                  role,
                  "radiology:report:write"
                )}
                canFinalize={hasRadiologyPermission(
                  role,
                  "radiology:report:finalize"
                )}
                onSaveReport={(payload) =>
                  mutate(
                    "/api/radiology/reports",
                    "POST",
                    payload,
                    payload.status === "Finalized"
                      ? `Radiologist report for ${payload.requestId} finalized and locked.`
                      : `Radiologist report for ${payload.requestId} saved (${payload.status}).`
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
