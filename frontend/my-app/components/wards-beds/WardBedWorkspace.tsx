"use client";

import React, { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import {
  hasWardBedPermission,
  WARD_BED_ROLES,
} from "@/lib/wards-beds/permissions";
import type { WardBedRole, WardBedState } from "@/lib/wards-beds/types";
import { BedAllocationSection } from "./BedAllocationSection";
import { BedAvailabilitySection } from "./BedAvailabilitySection";
import { BedTransferSection } from "./BedTransferSection";
import { CleaningStatusSection } from "./CleaningStatusSection";
import { IsolationBedSection } from "./IsolationBedSection";
import { OccupancyTrackingSection } from "./OccupancyTrackingSection";
import { WardConfigurationSection } from "./WardConfigurationSection";

type WardTab =
  | "wards"
  | "availability"
  | "allocation"
  | "transfer"
  | "cleaning"
  | "occupancy"
  | "isolation";

const WARD_TABS: { id: WardTab; label: string; step: number }[] = [
  { id: "wards", label: "Ward Configuration", step: 1 },
  { id: "availability", label: "Bed Availability", step: 2 },
  { id: "allocation", label: "Bed Allocation", step: 3 },
  { id: "transfer", label: "Bed Transfer", step: 4 },
  { id: "cleaning", label: "Cleaning Status", step: 5 },
  { id: "occupancy", label: "Occupancy Tracking", step: 6 },
  { id: "isolation", label: "Isolation Beds", step: 7 },
];

export function WardBedWorkspace() {
  const [role, setRole] = useState<WardBedRole>("Ward Manager");
  const [activeTab, setActiveTab] = useState<WardTab>("availability");
  const [db, setDb] = useState<WardBedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(apiUrl("/api/wards-beds/state"), {
          headers: { "x-ward-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Failed to load Ward & Bed Management data.",
          });
          return;
        }
        setDb(data as WardBedState);
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
    const res = await fetch(apiUrl("/api/wards-beds/state"), {
      headers: { "x-ward-role": role },
      cache: "no-store",
    });
    if (res.ok) {
      setDb((await res.json()) as WardBedState);
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
            "x-ward-role": role,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotice({
            type: "error",
            text: data.error || "Ward & Bed action failed.",
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
                <rect x="10" y="6" width="4" height="14" rx="2" fill="#8FC1CE" />
                <rect x="16" y="3" width="4" height="17" rx="2" fill="#6AB4A4" />
              </svg>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#181C1E] px-5 py-2.5 text-sm font-semibold text-white">
              Ward &amp; Bed Management
            </span>

            <span className="inline-flex items-center rounded-full bg-[#EFF3F4] px-3.5 py-2 text-xs font-medium text-[#5A686E] ring-1 ring-white/75">
              Module 04 • Capacity, Allocation, Cleaning &amp; Isolation
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="ward-role-select"
              className="text-xs font-semibold text-[#526167]"
            >
              Active Role:
            </label>
            <select
              id="ward-role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as WardBedRole);
                setNotice(null);
              }}
              className="rounded-full border border-white bg-[#F5F8F9] px-4 py-2 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {WARD_BED_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Live Occupancy Summary Strip */}
        <section
          aria-label="Ward and Bed Live Summary"
          className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {[
            {
              label: "Total Beds",
              value: String(db?.occupancy.totalBeds ?? 0),
              badge: `${db?.occupancy.utilizationRate ?? 0}% Used`,
              tone: "bg-[#181C1E]",
            },
            {
              label: "Available Beds",
              value: String(db?.occupancy.availableBeds ?? 0),
              badge: "Ready",
              tone: "bg-[#6AB4A4]",
            },
            {
              label: "Occupied Beds",
              value: String(db?.occupancy.occupiedBeds ?? 0),
              badge: "Active",
              tone: "bg-[#8FC1CE]",
            },
            {
              label: "Under Cleaning / Maint.",
              value: String(db?.occupancy.unavailableBeds ?? 0),
              badge: "Locked",
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
          aria-label="Ward and Bed Workflows"
          className="mb-6 flex flex-wrap gap-2 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2.5"
        >
          {WARD_TABS.map((tab) => {
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
                      ? tab.id === "isolation"
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
            Loading Ward &amp; Bed Management workflows...
          </div>
        ) : (
          <main>
            {activeTab === "wards" && (
              <WardConfigurationSection
                wards={db.wards}
                beds={db.beds}
                canConfigure={hasWardBedPermission(role, "ward:configure")}
                onCreateWard={async (payload) => {
                  const res = await apiCall<{ ward: { id: string; name: string } }>(
                    "/api/wards-beds/wards",
                    "POST",
                    payload
                  );
                  if (res?.ward) {
                    setNotice({
                      type: "success",
                      text: `Ward ${res.ward.name} (${res.ward.id}) created.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onToggleWardActive={async (wardId, isActive) => {
                  const res = await apiCall<{ ward: { name: string } }>(
                    "/api/wards-beds/wards",
                    "PATCH",
                    { wardId, isActive }
                  );
                  if (res?.ward) {
                    setNotice({
                      type: "success",
                      text: `Ward ${res.ward.name} ${isActive ? "activated" : "deactivated"}.`,
                    });
                  }
                }}
                onCreateBed={async (payload) => {
                  const res = await apiCall<{ bed: { id: string; bedNumber: string } }>(
                    "/api/wards-beds/beds",
                    "POST",
                    payload
                  );
                  if (res?.bed) {
                    setNotice({
                      type: "success",
                      text: `Bed ${res.bed.bedNumber} (${res.bed.id}) added to ward.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "availability" && (
              <BedAvailabilitySection
                wards={db.wards}
                beds={db.beds}
                canUpdateStatus={hasWardBedPermission(role, "bed:status")}
                onUpdateBedStatus={async (bedId, status) => {
                  const res = await apiCall<{ bed: { bedNumber: string; status: string } }>(
                    "/api/wards-beds/beds",
                    "PATCH",
                    { bedId, status }
                  );
                  if (res?.bed) {
                    setNotice({
                      type: "success",
                      text: `Bed ${res.bed.bedNumber} status updated to ${res.bed.status}.`,
                    });
                  }
                }}
              />
            )}

            {activeTab === "allocation" && (
              <BedAllocationSection
                beds={db.beds}
                admissions={db.admissions}
                allocations={db.allocations}
                canAllocate={hasWardBedPermission(role, "bed:allocate")}
                onAllocate={async (payload) => {
                  const res = await apiCall<{
                    allocation: { id: string; bedNumber: string; patientName: string };
                  }>("/api/wards-beds/allocations", "POST", payload);
                  if (res?.allocation) {
                    setNotice({
                      type: "success",
                      text: `Allocated Bed ${res.allocation.bedNumber} to ${res.allocation.patientName} (${res.allocation.id}).`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "transfer" && (
              <BedTransferSection
                beds={db.beds}
                admissions={db.admissions}
                transfers={db.transfers}
                canTransfer={hasWardBedPermission(role, "bed:transfer")}
                onTransfer={async (payload) => {
                  const res = await apiCall<{ transfer: { id: string } }>(
                    "/api/wards-beds/transfers",
                    "POST",
                    payload
                  );
                  if (res?.transfer) {
                    setNotice({
                      type: "success",
                      text: `Bed transfer ${res.transfer.id} completed; previous bed queued for cleaning.`,
                    });
                    return true;
                  }
                  return false;
                }}
              />
            )}

            {activeTab === "cleaning" && (
              <CleaningStatusSection
                cleaningLogs={db.cleaningLogs}
                canManage={hasWardBedPermission(role, "cleaning:manage")}
                onUpdateCleaning={async (payload) => {
                  const res = await apiCall<{
                    cleaningLog: { bedNumber: string; cleaningStatus: string };
                  }>("/api/wards-beds/cleaning", "PATCH", payload);
                  if (res?.cleaningLog) {
                    setNotice({
                      type: "success",
                      text:
                        res.cleaningLog.cleaningStatus === "Cleaned"
                          ? `Bed ${res.cleaningLog.bedNumber} cleaned and released as Available.`
                          : `Cleaning started for Bed ${res.cleaningLog.bedNumber}.`,
                    });
                  }
                }}
              />
            )}

            {activeTab === "occupancy" && (
              <OccupancyTrackingSection occupancy={db.occupancy} />
            )}

            {activeTab === "isolation" && (
              <IsolationBedSection
                beds={db.beds}
                admissions={db.admissions}
                cleaningLogs={db.cleaningLogs}
                canManageIsolation={hasWardBedPermission(
                  role,
                  "isolation:manage"
                )}
                canManageCleaning={hasWardBedPermission(
                  role,
                  "cleaning:manage"
                )}
                onAllocateIsolation={async (payload) => {
                  const res = await apiCall<{
                    allocation: { bedNumber: string; patientName: string };
                  }>("/api/wards-beds/allocations", "POST", payload);
                  if (res?.allocation) {
                    setNotice({
                      type: "success",
                      text: `Isolation Bed ${res.allocation.bedNumber} allocated to ${res.allocation.patientName}.`,
                    });
                    return true;
                  }
                  return false;
                }}
                onUpdateCleaning={async (payload) => {
                  const res = await apiCall<{
                    cleaningLog: { bedNumber: string };
                  }>("/api/wards-beds/cleaning", "PATCH", payload);
                  if (res?.cleaningLog) {
                    setNotice({
                      type: "success",
                      text: `Isolation Bed ${res.cleaningLog.bedNumber} certified sanitized and available.`,
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
