"use client";

import React, { useState } from "react";
import type {
  BillingAuditLog,
  BillingCategory,
  BillingInvoice,
  BillingPayment,
  BillingRefund,
  InsuranceClaim,
  PaymentMethod,
} from "@/lib/billing/types";
import { formatDateTime, formatMoney, getBillingBadgeClass } from "./ui";

type ReportPeriod = "All" | "Daily" | "Weekly" | "Monthly" | "Custom";

interface FinanceDashboardSectionProps {
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  claims: InsuranceClaim[];
  refunds: BillingRefund[];
  auditLogs: BillingAuditLog[];
}

export function FinanceDashboardSection({
  invoices,
  payments,
  claims,
  refunds,
  auditLogs,
}: FinanceDashboardSectionProps) {
  const [period, setPeriod] = useState<ReportPeriod>("All");
  const [fromDate, setFromDate] = useState(() =>
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  function inPeriod(iso: string): boolean {
    if (period === "All") return true;
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return true;
    const now = new Date();
    if (period === "Daily") {
      return iso.slice(0, 10) === now.toISOString().slice(0, 10);
    }
    if (period === "Weekly") {
      return ts >= now.getTime() - 7 * 86400000;
    }
    if (period === "Monthly") {
      return ts >= now.getTime() - 30 * 86400000;
    }
    const start = new Date(`${fromDate}T00:00:00`).getTime();
    const end = new Date(`${toDate}T23:59:59`).getTime();
    return ts >= start && ts <= end;
  }

  const scopedInvoices = invoices.filter(
    (i) => i.status !== "Cancelled" && inPeriod(i.createdAt)
  );
  const scopedPayments = payments.filter((p) => inPeriod(p.paidAt));
  const scopedRefunds = refunds.filter((r) => inPeriod(r.refundedAt));
  const scopedClaims = claims.filter((c) => inPeriod(c.createdAt));

  const totalBilled = scopedInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = scopedPayments.reduce((s, p) => s + p.amount, 0);
  const totalRefunded = scopedRefunds.reduce((s, r) => s + r.amount, 0);
  const totalOutstanding = scopedInvoices.reduce(
    (s, i) => s + i.outstandingBalance,
    0
  );

  const categories: BillingCategory[] = [
    "OPD",
    "IPD",
    "Surgery",
    "Laboratory",
    "Pharmacy",
  ];
  const categoryBreakdown = categories.map((cat) => {
    const catInv = scopedInvoices.filter((i) => i.category === cat);
    return {
      category: cat,
      count: catInv.length,
      billed: catInv.reduce((s, i) => s + i.totalAmount, 0),
      collected: catInv.reduce((s, i) => s + i.paidAmount, 0),
      outstanding: catInv.reduce((s, i) => s + i.outstandingBalance, 0),
    };
  });

  const methods: PaymentMethod[] = [
    "Cash",
    "Card",
    "UPI",
    "Bank Transfer",
    "Insurance",
  ];
  const methodBreakdown = methods.map((m) => {
    const list = scopedPayments.filter((p) => p.paymentMethod === m);
    return {
      method: m,
      count: list.length,
      amount: list.reduce((s, p) => s + p.amount, 0),
    };
  });

  const pendingClaimsTotal = scopedClaims
    .filter((c) => c.status !== "Settled" && c.status !== "Rejected")
    .reduce((s, c) => s + c.claimedAmount, 0);
  const settledClaimsTotal = scopedClaims
    .filter((c) => c.status === "Settled")
    .reduce((s, c) => s + c.settledAmount, 0);

  return (
    <div className="space-y-5">
      {/* Period Selector */}
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Financial Analytics & Reports
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Real-time revenue, collections, departmental breakdown, insurance
            settlements, refunds, and immutable audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Daily", "Weekly", "Monthly", "Custom"] as const).map(
            (p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  period === p
                    ? "bg-[#181C1E] text-white"
                    : "bg-white text-[#47565C] hover:bg-[#F8FAFA]"
                }`}
              >
                {p}
              </button>
            )
          )}
          {period === "Custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1 text-xs"
              />
              <span className="text-xs text-[#6B7A80]">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total Revenue Billed",
            value: formatMoney(totalBilled),
            sub: `${scopedInvoices.length} active invoice(s)`,
            dot: "bg-[#4A90A4]",
          },
          {
            label: "Net Collected Payments",
            value: formatMoney(Math.max(0, totalCollected - totalRefunded)),
            sub: `${scopedPayments.length} payment(s)`,
            dot: "bg-[#6AB4A4]",
          },
          {
            label: "Outstanding Balances",
            value: formatMoney(totalOutstanding),
            sub: `Pending claims: ${formatMoney(pendingClaimsTotal)}`,
            dot: "bg-[#EB9B52]",
          },
          {
            label: "Total Refunds Issued",
            value: formatMoney(totalRefunded),
            sub: `${scopedRefunds.length} refund(s) • Settled Ins: ${formatMoney(settledClaimsTotal)}`,
            dot: "bg-[#EF5B3A]",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-white/85 bg-[#EDF2F3] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B7A80]">
                {card.label}
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${card.dot}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#14191B]">
              {card.value}
            </p>
            <p className="mt-1 text-[11px] text-[#7D8C92]">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Department Revenue + Payment Methods */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
          <h3 className="text-base font-semibold text-[#14191B]">
            Department Revenue Breakdown
          </h3>
          <div className="mt-4 space-y-2.5">
            {categoryBreakdown.map((row) => (
              <div
                key={row.category}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/90 bg-[#F8FAFA] px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#14191B]">
                    {row.category} Billing
                  </p>
                  <p className="text-[11px] text-[#6B7A80]">
                    {row.count} invoice(s) • Outstanding:{" "}
                    {formatMoney(row.outstanding)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#14191B]">
                    {formatMoney(row.billed)}
                  </p>
                  <p className="text-[11px] text-[#1F6355]">
                    Collected: {formatMoney(row.collected)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Payment Method Breakdown
          </h3>
          <div className="mt-4 space-y-2.5">
            {methodBreakdown.map((m) => (
              <div
                key={m.method}
                className="flex items-center justify-between rounded-[18px] border border-white/90 bg-[#F8FAFA] px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#14191B]">{m.method}</p>
                  <p className="text-[11px] text-[#6B7A80]">
                    {m.count} transaction(s)
                  </p>
                </div>
                <span className="font-bold text-[#14191B]">
                  {formatMoney(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <h3 className="text-base font-semibold text-[#14191B]">
          Financial Transaction Audit Log ({auditLogs.length})
        </h3>
        <div className="mt-3 space-y-2">
          {auditLogs.slice(0, 12).map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getBillingBadgeClass(log.action)}`}
                >
                  {log.entityType} • {log.action}
                </span>
                <span className="font-semibold text-[#14191B]">
                  {log.entityId}
                </span>
                <span className="text-[#546369]">{log.details}</span>
              </div>
              <span className="text-[11px] text-[#7D8C92]">
                {log.actorName} ({log.actorRole}) •{" "}
                {formatDateTime(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
