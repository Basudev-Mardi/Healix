"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import {
  BILLING_ROLES,
  hasBillingPermission,
} from "@/lib/billing/permissions";
import type { BillingRole, BillingState } from "@/lib/billing/types";
import { DepartmentBillingSection } from "./DepartmentBillingSection";
import { FinanceDashboardSection } from "./FinanceDashboardSection";
import { InsuranceClaimsSection } from "./InsuranceClaimsSection";
import { InvoicesSection } from "./InvoicesSection";
import { RefundsSection } from "./RefundsSection";
import { formatMoney } from "./ui";

type BillingTab =
  | "dashboard"
  | "opd"
  | "ipd"
  | "surgery"
  | "laboratory"
  | "pharmacy"
  | "insurance"
  | "refunds"
  | "invoices";

const BILLING_TABS: { id: BillingTab; label: string }[] = [
  { id: "dashboard", label: "Finance Reports" },
  { id: "opd", label: "1. OPD Billing" },
  { id: "ipd", label: "2. IPD Billing" },
  { id: "surgery", label: "3. Surgery Billing" },
  { id: "laboratory", label: "4. Lab Billing" },
  { id: "pharmacy", label: "5. Pharmacy Billing" },
  { id: "insurance", label: "6. Insurance Claims" },
  { id: "refunds", label: "7. Refunds" },
  { id: "invoices", label: "8. Invoices" },
];

export function BillingWorkspace() {
  const [role, setRole] = useState<BillingRole>("Finance Manager");
  const [activeTab, setActiveTab] = useState<BillingTab>("dashboard");
  const [state, setState] = useState<BillingState | null>(null);
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
        const res = await fetch(apiUrl("/api/billing/state"), {
          headers: { "x-billing-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load Billing state.");
        }
        if (!cancelled) {
          setState(data as BillingState);
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text:
              err instanceof Error
                ? err.message
                : "Could not reach Billing API.",
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
    const res = await fetch(apiUrl("/api/billing/state"), {
      headers: { "x-billing-role": role },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh Billing state.");
    }
    setState(data as BillingState);
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
          "x-billing-role": role,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Financial operation failed.");
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

  const totalRevenue =
    state?.invoices
      .filter((i) => i.status !== "Cancelled")
      .reduce((s, i) => s + i.totalAmount, 0) ?? 0;
  const totalCollected =
    state?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  const totalOutstanding =
    state?.invoices
      .filter((i) => i.status !== "Cancelled")
      .reduce((s, i) => s + i.outstandingBalance, 0) ?? 0;
  const openClaimsCount =
    state?.claims.filter(
      (c) => c.status !== "Settled" && c.status !== "Rejected"
    ).length ?? 0;

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Top Header */}
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Module 10 • Billing & Finance
              </span>
              <Link
                href="/"
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#47565C] transition hover:bg-[#F8FAFA]"
              >
                ← Back to Hub
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              Billing & Finance Management
            </h1>
            <p className="text-xs text-[#6B7A80]">
              Unified revenue cycle across OPD, IPD, Surgery, Laboratory,
              Pharmacy, Insurance Claims, Refunds, PDF Invoices, and Financial
              Reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A80]">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as BillingRole);
                setBanner(null);
              }}
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {BILLING_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Live Financial KPI Strip */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Total Revenue Billed",
              value: formatMoney(totalRevenue),
              accent: "bg-[#4A90A4]",
            },
            {
              label: "Collected Payments",
              value: formatMoney(totalCollected),
              accent: "bg-[#6AB4A4]",
            },
            {
              label: "Outstanding Balance",
              value: formatMoney(totalOutstanding),
              accent: "bg-[#EB9B52]",
            },
            {
              label: "Active Insurance Claims",
              value: String(openClaimsCount),
              accent: "bg-[#8FC1CE]",
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
        <nav className="flex flex-wrap gap-1.5 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2">
          {BILLING_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
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

        {/* Active Panel */}
        {loading || !state ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-12 text-center text-sm text-[#6B7A80]">
            Loading Billing & Finance workspace...
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <FinanceDashboardSection
                invoices={state.invoices}
                payments={state.payments}
                claims={state.claims}
                refunds={state.refunds}
                auditLogs={state.auditLogs}
              />
            )}

            {(activeTab === "opd" ||
              activeTab === "ipd" ||
              activeTab === "surgery" ||
              activeTab === "laboratory" ||
              activeTab === "pharmacy") && (
              <DepartmentBillingSection
                key={activeTab}
                category={
                  activeTab === "opd"
                    ? "OPD"
                    : activeTab === "ipd"
                      ? "IPD"
                      : activeTab === "surgery"
                        ? "Surgery"
                        : activeTab === "laboratory"
                          ? "Laboratory"
                          : "Pharmacy"
                }
                patients={state.patients}
                sources={state.sources[activeTab]}
                invoices={state.invoices}
                payments={state.payments}
                canCreate={hasBillingPermission(role, "billing:invoice:create")}
                canCollect={hasBillingPermission(
                  role,
                  "billing:payment:collect"
                )}
                onCreateInvoice={(payload) =>
                  mutate(
                    "/api/billing/invoices",
                    "POST",
                    payload,
                    `${payload.category} invoice generated successfully.`
                  )
                }
                onCollectPayment={(payload) =>
                  mutate(
                    "/api/billing/payments",
                    "POST",
                    payload,
                    `Payment of ${formatMoney(payload.amount)} collected via ${payload.paymentMethod}.`
                  )
                }
              />
            )}

            {activeTab === "insurance" && (
              <InsuranceClaimsSection
                providers={state.providers}
                invoices={state.invoices}
                claims={state.claims}
                canManage={hasBillingPermission(
                  role,
                  "billing:insurance:manage"
                )}
                onCreateProvider={(payload) =>
                  mutate(
                    "/api/billing/providers",
                    "POST",
                    payload,
                    `Insurance provider "${payload.name}" registered.`
                  )
                }
                onCreateClaim={(payload) =>
                  mutate(
                    "/api/billing/claims",
                    "POST",
                    payload,
                    `Insurance claim submitted for ${payload.invoiceId}.`
                  )
                }
                onUpdateClaim={async (payload) => {
                  await mutate(
                    "/api/billing/claims",
                    "PATCH",
                    payload,
                    `Insurance claim ${payload.claimId} updated to ${payload.status}.`
                  );
                }}
              />
            )}

            {activeTab === "refunds" && (
              <RefundsSection
                invoices={state.invoices}
                refunds={state.refunds}
                canAuthorizeRefund={hasBillingPermission(
                  role,
                  "billing:refund:authorize"
                )}
                onProcessRefund={(payload) =>
                  mutate(
                    "/api/billing/refunds",
                    "POST",
                    payload,
                    `${payload.refundType} refund of ${formatMoney(payload.amount)} processed for ${payload.invoiceId}.`
                  )
                }
              />
            )}

            {activeTab === "invoices" && (
              <InvoicesSection
                invoices={state.invoices}
                payments={state.payments}
                canCancel={hasBillingPermission(role, "billing:invoice:cancel")}
                onCancelInvoice={async (invoiceId, reason) => {
                  await mutate(
                    "/api/billing/invoices/cancel",
                    "PATCH",
                    { invoiceId, reason },
                    `Invoice ${invoiceId} cancelled.`
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
