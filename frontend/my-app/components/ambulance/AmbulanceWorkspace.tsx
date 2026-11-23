"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import {
  AMBULANCE_ROLES,
  hasAmbulancePermission,
} from "@/lib/ambulance/permissions";
import type { AmbulanceRole, AmbulanceState } from "@/lib/ambulance/types";
import { AmbulanceDashboardSection } from "./AmbulanceDashboardSection";
import { DriversSection } from "./DriversSection";
import { EmergencyDispatchSection } from "./EmergencyDispatchSection";
import { TripRecordsSection } from "./TripRecordsSection";
import { VehiclesSection } from "./VehiclesSection";

type AmbulanceTab = "dashboard" | "dispatch" | "vehicles" | "drivers" | "trips";

const AMBULANCE_TABS: { id: AmbulanceTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard & Reports" },
  { id: "dispatch", label: "3 & 5. Requests & Dispatch" },
  { id: "vehicles", label: "1 & 4. Fleet & Availability" },
  { id: "drivers", label: "2. Drivers" },
  { id: "trips", label: "6. Trip Records" },
];

export function AmbulanceWorkspace() {
  const [role, setRole] = useState<AmbulanceRole>("Ambulance Coordinator");
  const [activeTab, setActiveTab] = useState<AmbulanceTab>("dispatch");
  const [state, setState] = useState<AmbulanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/ambulance/state"), {
          headers: { "x-ambulance-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load Ambulance state.");
        }
        if (!cancelled) {
          setState(data as AmbulanceState);
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text:
              err instanceof Error
                ? err.message
                : "Could not reach Ambulance API.",
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
    const res = await fetch(apiUrl("/api/ambulance/state"), {
      headers: { "x-ambulance-role": role },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh Ambulance state.");
    }
    setState(data as AmbulanceState);
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
          "x-ambulance-role": role,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ambulance operation failed.");
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

  const availFleet =
    state?.vehicles.filter((v) => v.operationalStatus === "Available").length ??
    0;
  const onTripFleet =
    state?.vehicles.filter(
      (v) =>
        v.operationalStatus === "Assigned" ||
        v.operationalStatus === "Dispatched" ||
        v.operationalStatus === "On-Trip"
    ).length ?? 0;
  const activeRequests =
    state?.requests.filter(
      (r) => r.status !== "Completed" && r.status !== "Cancelled"
    ).length ?? 0;
  const availDrivers =
    state?.drivers.filter(
      (d) =>
        d.availabilityStatus === "Available" && d.employmentStatus === "Active"
    ).length ?? 0;

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Module 12 • Ambulance & EMS
              </span>
              <Link
                href="/"
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#47565C] transition hover:bg-[#F8FAFA]"
              >
                ← Back to Hub
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              Ambulance Management
            </h1>
            <p className="text-xs text-[#6B7A80]">
              Fleet registration, driver licensing, emergency requests,
              conflict-free dispatch tracking, trip records, and compliance
              alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A80]">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as AmbulanceRole);
                setBanner(null);
              }}
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {AMBULANCE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Available Ambulances",
              value: `${availFleet} / ${state?.vehicles.length ?? 0}`,
              accent: "bg-[#6AB4A4]",
            },
            {
              label: "Ambulances On Trip",
              value: String(onTripFleet),
              accent: "bg-[#8FC1CE]",
            },
            {
              label: "Active Requests",
              value: String(activeRequests),
              accent: "bg-[#EB9B52]",
            },
            {
              label: "Available Drivers",
              value: `${availDrivers} / ${state?.drivers.length ?? 0}`,
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

        <nav className="flex flex-wrap gap-1.5 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2">
          {AMBULANCE_TABS.map((tab) => (
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

        {loading || !state ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-12 text-center text-sm text-[#6B7A80]">
            Loading Ambulance Management workspace...
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <AmbulanceDashboardSection
                gpsConfigured={state.gpsConfigured}
                vehicles={state.vehicles}
                drivers={state.drivers}
                requests={state.requests}
                trips={state.trips}
                auditLogs={state.auditLogs}
              />
            )}

            {activeTab === "dispatch" && (
              <EmergencyDispatchSection
                patients={state.patients}
                vehicles={state.vehicles}
                drivers={state.drivers}
                requests={state.requests}
                dispatches={state.dispatches}
                canCreateRequest={hasAmbulancePermission(
                  role,
                  "ambulance:request:create"
                )}
                canDispatch={hasAmbulancePermission(
                  role,
                  "ambulance:dispatch:manage"
                )}
                canUpdateTrip={hasAmbulancePermission(
                  role,
                  "ambulance:trip:update"
                )}
                onCreateRequest={(payload) =>
                  mutate(
                    "/api/ambulance/requests",
                    "POST",
                    payload,
                    `Emergency ambulance request logged for ${payload.patientName}.`
                  )
                }
                onCancelRequest={async (requestId) => {
                  await mutate(
                    "/api/ambulance/requests",
                    "PATCH",
                    {
                      requestId,
                      cancel: true,
                      cancelReason: "Cancelled by dispatch desk",
                    },
                    `Emergency request ${requestId} cancelled.`
                  );
                }}
                onAssignDispatch={(payload) =>
                  mutate(
                    "/api/ambulance/dispatches",
                    "POST",
                    payload,
                    `Ambulance assigned and dispatch created for ${payload.requestId}.`
                  )
                }
                onProgressDispatch={async (payload) => {
                  await mutate(
                    "/api/ambulance/dispatches",
                    "PATCH",
                    payload,
                    `Dispatch ${payload.dispatchId} updated to ${payload.nextStatus}.`
                  );
                }}
              />
            )}

            {activeTab === "vehicles" && (
              <VehiclesSection
                vehicles={state.vehicles}
                canManage={hasAmbulancePermission(
                  role,
                  "ambulance:vehicle:manage"
                )}
                onRegisterVehicle={(payload) =>
                  mutate(
                    "/api/ambulance/vehicles",
                    "POST",
                    payload,
                    `Ambulance ${payload.registrationNumber.toUpperCase()} registered.`
                  )
                }
                onUpdateVehicleStatus={async (payload) => {
                  await mutate(
                    "/api/ambulance/vehicles",
                    "PATCH",
                    payload,
                    `Ambulance ${payload.ambulanceId} status updated to ${payload.operationalStatus}.`
                  );
                }}
              />
            )}

            {activeTab === "drivers" && (
              <DriversSection
                drivers={state.drivers}
                vehicles={state.vehicles}
                canManage={hasAmbulancePermission(
                  role,
                  "ambulance:driver:manage"
                )}
                onRegisterDriver={(payload) =>
                  mutate(
                    "/api/ambulance/drivers",
                    "POST",
                    payload,
                    `Driver "${payload.fullName}" registered.`
                  )
                }
                onUpdateDriverStatus={async (payload) => {
                  await mutate(
                    "/api/ambulance/drivers",
                    "PATCH",
                    payload,
                    `Driver ${payload.driverId} marked ${payload.availabilityStatus}.`
                  );
                }}
              />
            )}

            {activeTab === "trips" && <TripRecordsSection trips={state.trips} />}
          </>
        )}
      </div>
    </div>
  );
}
