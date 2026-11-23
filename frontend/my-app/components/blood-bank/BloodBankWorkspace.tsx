"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import {
  BLOOD_BANK_ROLES,
  hasBloodBankPermission,
} from "@/lib/blood-bank/permissions";
import type { BloodBankRole, BloodBankState } from "@/lib/blood-bank/types";
import { BloodBankDashboardSection } from "./BloodBankDashboardSection";
import { BloodRequestsSection } from "./BloodRequestsSection";
import { CompatibilityTestingSection } from "./CompatibilityTestingSection";
import { DonorRegistrationSection } from "./DonorRegistrationSection";
import { ExpiryMonitoringSection } from "./ExpiryMonitoringSection";
import { InventoryComponentsSection } from "./InventoryComponentsSection";
import { TransfusionRecordsSection } from "./TransfusionRecordsSection";
import { daysUntil } from "./ui";

type BloodBankTab =
  | "dashboard"
  | "donors"
  | "inventory"
  | "requests"
  | "compatibility"
  | "transfusions"
  | "expiry";

const BLOOD_TABS: { id: BloodBankTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard & Reports" },
  { id: "donors", label: "1. Donors" },
  { id: "inventory", label: "2-3. Inventory & Components" },
  { id: "requests", label: "4. Blood Requests" },
  { id: "compatibility", label: "5. Crossmatch & Issue" },
  { id: "transfusions", label: "6. Transfusions" },
  { id: "expiry", label: "7. Expiry Monitor" },
];

export function BloodBankWorkspace() {
  const [role, setRole] = useState<BloodBankRole>("Blood Bank Staff");
  const [activeTab, setActiveTab] = useState<BloodBankTab>("dashboard");
  const [state, setState] = useState<BloodBankState | null>(null);
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
        const res = await fetch(apiUrl("/api/blood-bank/state"), {
          headers: { "x-bloodbank-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load Blood Bank state.");
        }
        if (!cancelled) {
          setState(data as BloodBankState);
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text:
              err instanceof Error
                ? err.message
                : "Could not reach Blood Bank API.",
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
    const res = await fetch(apiUrl("/api/blood-bank/state"), {
      headers: { "x-bloodbank-role": role },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh Blood Bank state.");
    }
    setState(data as BloodBankState);
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
          "x-bloodbank-role": role,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Blood Bank operation failed.");
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

  const availableCount =
    state?.units.filter((u) => u.status === "Available").length ?? 0;
  const openRequestsCount =
    state?.requests.filter(
      (r) =>
        r.status === "Pending" ||
        r.status === "Approved" ||
        r.status === "Reserved"
    ).length ?? 0;
  const expiryAlertsCount =
    state?.units.filter(
      (u) =>
        u.status === "Expired" ||
        (u.status === "Available" && daysUntil(u.expiryDate) <= 7)
    ).length ?? 0;

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Module 11 • Blood Bank
              </span>
              <Link
                href="/"
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#47565C] transition hover:bg-[#F8FAFA]"
              >
                ← Back to Hub
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              Blood Bank Management
            </h1>
            <p className="text-xs text-[#6B7A80]">
              Donor-to-patient traceability across Donor Screening, Blood
              Collection, Component Separation, ABO/Rh Crossmatching, Issuing,
              Transfusions, and Expiry Control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A80]">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as BloodBankRole);
                setBanner(null);
              }}
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {BLOOD_BANK_ROLES.map((r) => (
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
              label: "Registered Donors",
              value: state?.donors.length ?? 0,
              accent: "bg-[#4A90A4]",
            },
            {
              label: "Available Blood Units",
              value: availableCount,
              accent: "bg-[#6AB4A4]",
            },
            {
              label: "Active Blood Requests",
              value: openRequestsCount,
              accent: "bg-[#EB9B52]",
            },
            {
              label: "Expiry Alerts (≤7d / Exp)",
              value: expiryAlertsCount,
              accent: "bg-[#EF5B3A]",
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
          {BLOOD_TABS.map((tab) => (
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
            Loading Blood Bank workspace...
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <BloodBankDashboardSection
                donors={state.donors}
                units={state.units}
                requests={state.requests}
                transfusions={state.transfusions}
                auditLogs={state.auditLogs}
              />
            )}

            {activeTab === "donors" && (
              <DonorRegistrationSection
                donors={state.donors}
                canManage={hasBloodBankPermission(role, "blood:donor:manage")}
                onRegisterDonor={(payload) =>
                  mutate(
                    "/api/blood-bank/donors",
                    "POST",
                    payload,
                    `Donor "${payload.fullName}" registered and screened.`
                  )
                }
              />
            )}

            {activeTab === "inventory" && (
              <InventoryComponentsSection
                donors={state.donors}
                units={state.units}
                canCollect={hasBloodBankPermission(role, "blood:unit:collect")}
                canScreen={hasBloodBankPermission(role, "blood:unit:screen")}
                canSeparate={hasBloodBankPermission(
                  role,
                  "blood:component:separate"
                )}
                onCollectUnit={(payload) =>
                  mutate(
                    "/api/blood-bank/units",
                    "POST",
                    payload,
                    "Blood donation collected and queued for infectious screening."
                  )
                }
                onScreenUnit={async (payload) => {
                  await mutate(
                    "/api/blood-bank/units/screen",
                    "PATCH",
                    payload,
                    `Unit ${payload.unitId} screening marked ${payload.screeningStatus}.`
                  );
                }}
                onSeparateComponent={(payload) =>
                  mutate(
                    "/api/blood-bank/components",
                    "POST",
                    payload,
                    `Separated ${payload.targetComponent} from unit ${payload.sourceUnitId}.`
                  )
                }
              />
            )}

            {activeTab === "requests" && (
              <BloodRequestsSection
                patients={state.patients}
                doctors={state.doctors}
                requests={state.requests}
                canCreate={hasBloodBankPermission(role, "blood:request:create")}
                canApprove={hasBloodBankPermission(
                  role,
                  "blood:request:approve"
                )}
                onCreateRequest={(payload) =>
                  mutate(
                    "/api/blood-bank/requests",
                    "POST",
                    payload,
                    `${payload.urgency} blood request submitted for ${payload.department}.`
                  )
                }
                onUpdateStatus={async (payload) => {
                  await mutate(
                    "/api/blood-bank/requests",
                    "PATCH",
                    payload,
                    `Blood request ${payload.requestId} marked ${payload.status}.`
                  );
                }}
              />
            )}

            {activeTab === "compatibility" && (
              <CompatibilityTestingSection
                requests={state.requests}
                units={state.units}
                tests={state.compatibilityTests}
                canTest={hasBloodBankPermission(
                  role,
                  "blood:compatibility:test"
                )}
                canVerify={hasBloodBankPermission(
                  role,
                  "blood:compatibility:verify"
                )}
                canAllocate={hasBloodBankPermission(role, "blood:unit:issue")}
                onRecordTest={(payload) =>
                  mutate(
                    "/api/blood-bank/compatibility",
                    "POST",
                    payload,
                    `Compatibility crossmatch recorded for ${payload.requestId}.`
                  )
                }
                onVerifyTest={async (payload) => {
                  await mutate(
                    "/api/blood-bank/compatibility",
                    "PATCH",
                    payload,
                    `Crossmatch ${payload.testId} marked ${payload.verificationStatus}.`
                  );
                }}
                onAllocateUnit={async (payload) => {
                  await mutate(
                    "/api/blood-bank/allocate",
                    "POST",
                    payload,
                    `Unit ${payload.unitId} ${payload.action === "reserve" ? "reserved" : "issued"} for ${payload.requestId}.`
                  );
                }}
              />
            )}

            {activeTab === "transfusions" && (
              <TransfusionRecordsSection
                units={state.units}
                transfusions={state.transfusions}
                canRecord={hasBloodBankPermission(
                  role,
                  "blood:transfusion:record"
                )}
                onRecordTransfusion={(payload) =>
                  mutate(
                    "/api/blood-bank/transfusions",
                    "POST",
                    payload,
                    `Transfusion recorded for unit ${payload.unitId}.`
                  )
                }
              />
            )}

            {activeTab === "expiry" && (
              <ExpiryMonitoringSection
                units={state.units}
                canDiscard={hasBloodBankPermission(role, "blood:unit:collect")}
                onDiscardUnit={async (unitId, reason) => {
                  await mutate(
                    "/api/blood-bank/units/discard",
                    "PATCH",
                    { unitId, reason },
                    `Blood unit ${unitId} discarded.`
                  );
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
