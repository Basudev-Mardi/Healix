"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import {
  hasPharmacyPermission,
  PHARMACY_ROLES,
} from "@/lib/pharmacy/permissions";
import type { PharmacyRole, PharmacyState } from "@/lib/pharmacy/types";
import { BatchTrackingSection } from "./BatchTrackingSection";
import { ExpiryTrackingSection } from "./ExpiryTrackingSection";
import { MedicineCatalogSection } from "./MedicineCatalogSection";
import { MedicineDispensingSection } from "./MedicineDispensingSection";
import { PrescriptionProcessingSection } from "./PrescriptionProcessingSection";
import { StockManagementSection } from "./StockManagementSection";
import { SupplierManagementSection } from "./SupplierManagementSection";
import { daysUntil } from "./ui";

type PharmacyTab =
  | "catalog"
  | "prescriptions"
  | "dispensing"
  | "stock"
  | "batches"
  | "expiry"
  | "suppliers";

const PHARMACY_TABS: { id: PharmacyTab; label: string }[] = [
  { id: "catalog", label: "1. Medicine Catalog" },
  { id: "prescriptions", label: "2. Prescriptions" },
  { id: "dispensing", label: "3. Dispensing (FEFO)" },
  { id: "stock", label: "4. Stock Management" },
  { id: "batches", label: "5. Batch Tracking" },
  { id: "expiry", label: "6. Expiry Tracking" },
  { id: "suppliers", label: "7. Suppliers" },
];

export function PharmacyWorkspace() {
  const [role, setRole] = useState<PharmacyRole>("Pharmacist");
  const [activeTab, setActiveTab] = useState<PharmacyTab>("prescriptions");
  const [state, setState] = useState<PharmacyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffRxId, setHandoffRxId] = useState<string | undefined>(undefined);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/pharmacy/state"), {
          headers: { "x-pharmacy-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load Pharmacy state.");
        }
        if (!cancelled) {
          setState(data as PharmacyState);
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text:
              err instanceof Error
                ? err.message
                : "Could not reach Pharmacy API.",
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
    const res = await fetch(apiUrl("/api/pharmacy/state"), {
      headers: { "x-pharmacy-role": role },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh Pharmacy state.");
    }
    setState(data as PharmacyState);
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
          "x-pharmacy-role": role,
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

  const openRxCount =
    state?.prescriptions.filter(
      (r) => r.status !== "Completed" && r.status !== "Cancelled"
    ).length ?? 0;
  const lowStockCount =
    state?.medicines.filter((m) => m.stockAlert !== "In Stock").length ?? 0;
  const expiryAlertCount =
    state?.batches.filter(
      (b) =>
        b.status !== "Depleted" &&
        b.status !== "Disposed" &&
        (b.status === "Expired" ||
          b.status === "Quarantined" ||
          daysUntil(b.expiryDate) <= 60)
    ).length ?? 0;
  const activeSuppliersCount =
    state?.suppliers.filter((s) => s.status === "Active").length ?? 0;

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Top Header */}
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Module 09 • Pharmacy
              </span>
              <Link
                href="/"
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#47565C] transition hover:bg-[#F8FAFA]"
              >
                ← Back to Hub
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              Pharmacy Management
            </h1>
            <p className="text-xs text-[#6B7A80]">
              End-to-end medication workflow: Medicine Catalog, Prescriptions,
              FEFO Dispensing, Stock Control, Batch & Expiry Tracking, and
              Supplier Management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A80]">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as PharmacyRole);
                setBanner(null);
              }}
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {PHARMACY_ROLES.map((r) => (
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
              label: "Open Prescriptions",
              value: openRxCount,
              accent: "bg-[#8FC1CE]",
            },
            {
              label: "Low / Out of Stock",
              value: lowStockCount,
              accent: "bg-[#EB9B52]",
            },
            {
              label: "Expiry Alerts (≤60d)",
              value: expiryAlertCount,
              accent: "bg-[#EF5B3A]",
            },
            {
              label: "Active Suppliers",
              value: activeSuppliersCount,
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
          {PHARMACY_TABS.map((tab) => (
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
            Loading Pharmacy Management workspace...
          </div>
        ) : (
          <>
            {activeTab === "catalog" && (
              <MedicineCatalogSection
                medicines={state.medicines}
                canManage={hasPharmacyPermission(
                  role,
                  "pharmacy:catalog:manage"
                )}
                onCreateMedicine={(payload) =>
                  mutate(
                    "/api/pharmacy/medicines",
                    "POST",
                    payload,
                    `Medicine ${payload.medicineCode.toUpperCase()} added to catalog.`
                  )
                }
                onToggleActive={async (medicineId, isActive) => {
                  await mutate(
                    "/api/pharmacy/medicines",
                    "PATCH",
                    { medicineId, isActive },
                    `Medicine ${medicineId} marked ${isActive ? "Active" : "Inactive"}.`
                  );
                }}
              />
            )}

            {activeTab === "prescriptions" && (
              <PrescriptionProcessingSection
                patients={state.patients}
                doctors={state.doctors}
                medicines={state.medicines}
                prescriptions={state.prescriptions}
                canCreate={hasPharmacyPermission(
                  role,
                  "pharmacy:prescription:create"
                )}
                canProcess={hasPharmacyPermission(
                  role,
                  "pharmacy:prescription:process"
                )}
                onCreatePrescription={(payload) =>
                  mutate(
                    "/api/pharmacy/prescriptions",
                    "POST",
                    payload,
                    "Prescription issued and queued for pharmacy."
                  )
                }
                onProcessPrescription={async (payload) => {
                  await mutate(
                    "/api/pharmacy/prescriptions",
                    "PATCH",
                    payload,
                    `Prescription ${payload.prescriptionId} updated to ${payload.status}.`
                  );
                }}
                onNavigateDispense={(rxId) => {
                  setHandoffRxId(rxId);
                  setActiveTab("dispensing");
                }}
              />
            )}

            {activeTab === "dispensing" && (
              <MedicineDispensingSection
                prescriptions={state.prescriptions}
                batches={state.batches}
                dispensings={state.dispensings}
                preselectedPrescriptionId={handoffRxId}
                canDispense={hasPharmacyPermission(role, "pharmacy:dispense")}
                onDispense={(payload) =>
                  mutate(
                    "/api/pharmacy/dispense",
                    "POST",
                    payload,
                    `Medicine dispensed via FEFO for ${payload.prescriptionId}.`
                  )
                }
              />
            )}

            {activeTab === "stock" && (
              <StockManagementSection
                medicines={state.medicines}
                batches={state.batches}
                movements={state.stockMovements}
                canManageStock={hasPharmacyPermission(
                  role,
                  "pharmacy:stock:manage"
                )}
                onAdjustStock={(payload) =>
                  mutate(
                    "/api/pharmacy/stock",
                    "PATCH",
                    payload,
                    `Stock adjustment applied to batch ${payload.batchId}.`
                  )
                }
                onUpdateThreshold={async (medicineId, minStockThreshold) => {
                  await mutate(
                    "/api/pharmacy/medicines",
                    "PATCH",
                    { medicineId, minStockThreshold },
                    `Minimum stock threshold updated to ${minStockThreshold}.`
                  );
                }}
              />
            )}

            {activeTab === "batches" && (
              <BatchTrackingSection
                medicines={state.medicines}
                suppliers={state.suppliers}
                batches={state.batches}
                canManageBatch={hasPharmacyPermission(
                  role,
                  "pharmacy:batch:manage"
                )}
                onCreateBatch={(payload) =>
                  mutate(
                    "/api/pharmacy/batches",
                    "POST",
                    payload,
                    `Batch ${payload.batchNumber.toUpperCase()} received into inventory.`
                  )
                }
              />
            )}

            {activeTab === "expiry" && (
              <ExpiryTrackingSection
                medicines={state.medicines}
                batches={state.batches}
                canManageExpiry={hasPharmacyPermission(
                  role,
                  "pharmacy:expiry:manage"
                )}
                onUpdateExpiryStatus={async (payload) => {
                  await mutate(
                    "/api/pharmacy/expiry",
                    "PATCH",
                    payload,
                    `Batch ${payload.batchId} marked ${payload.status}.`
                  );
                }}
              />
            )}

            {activeTab === "suppliers" && (
              <SupplierManagementSection
                suppliers={state.suppliers}
                batches={state.batches}
                canManage={hasPharmacyPermission(
                  role,
                  "pharmacy:supplier:manage"
                )}
                onCreateSupplier={(payload) =>
                  mutate(
                    "/api/pharmacy/suppliers",
                    "POST",
                    payload,
                    `Supplier "${payload.name}" registered.`
                  )
                }
                onToggleSupplierStatus={async (supplierId, status) => {
                  await mutate(
                    "/api/pharmacy/suppliers",
                    "PATCH",
                    { supplierId, status },
                    `Supplier ${supplierId} marked ${status}.`
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
