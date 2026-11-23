"use client";

import React, { useState } from "react";
import type { BillingInvoice, BillingPayment } from "@/lib/billing/types";
import {
  DANGER_BTN_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  formatMoney,
  getBillingBadgeClass,
  printInvoicePdf,
} from "./ui";

interface InvoicesSectionProps {
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  canCancel: boolean;
  onCancelInvoice: (invoiceId: string, reason: string) => Promise<void>;
}

export function InvoicesSection({
  invoices,
  payments,
  canCancel,
  onCancelInvoice,
}: InvoicesSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(invoices[0]?.id ?? "");

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "All" && inv.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.billNumber.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.patientId.toLowerCase().includes(q) ||
        inv.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeInvoice =
    invoices.find((i) => i.id === selectedId) ?? filtered[0];
  const activePayments = activeInvoice
    ? payments.filter((p) => p.invoiceId === activeInvoice.id)
    : [];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Filterable Invoice Directory */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5">
        <h2 className="text-lg font-semibold text-[#14191B]">
          All Hospital Invoices ({filtered.length})
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, patient, bill #..."
            className="flex-1 rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Refunded">Refunded</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.map((inv) => (
            <button
              key={inv.id}
              type="button"
              onClick={() => setSelectedId(inv.id)}
              className={`w-full rounded-[18px] border p-3.5 text-left text-xs transition ${
                activeInvoice?.id === inv.id
                  ? "border-[#181C1E] bg-[#181C1E] text-white"
                  : "border-white/90 bg-[#F8FAFA] text-[#14191B] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                  {inv.id} • {inv.category}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBillingBadgeClass(inv.status)}`}
                >
                  {inv.status}
                </span>
              </div>
              <p className="mt-1 font-medium">{inv.patientName}</p>
              <div className="mt-1 flex justify-between text-[11px] opacity-80">
                <span>Total: {formatMoney(inv.totalAmount)}</span>
                <span>Due: {formatMoney(inv.outstandingBalance)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Professional Invoice Preview + Print / Download PDF */}
      <div className="lg:col-span-7">
        {activeInvoice ? (
          <div className="rounded-[28px] border border-white/85 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#E6EDEF] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4A90A4]">
                  Healix Hospital — {activeInvoice.category} Tax Invoice
                </p>
                <h3 className="mt-1 text-xl font-bold text-[#14191B]">
                  {activeInvoice.id} ({activeInvoice.billNumber})
                </h3>
                <p className="text-xs text-[#6B7A80]">
                  Issued {formatDateTime(activeInvoice.createdAt)} • Due{" "}
                  {activeInvoice.dueDate || "Upon Receipt"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => printInvoicePdf(activeInvoice, activePayments)}
                  className={PRIMARY_BTN_CLASS}
                >
                  Print / Download PDF
                </button>
                {canCancel &&
                  activeInvoice.status !== "Cancelled" &&
                  activeInvoice.paidAmount - activeInvoice.refundedAmount <=
                    0.01 && (
                    <button
                      type="button"
                      onClick={() =>
                        onCancelInvoice(
                          activeInvoice.id,
                          "Cancelled by authorized Finance user"
                        )
                      }
                      className={DANGER_BTN_CLASS}
                    >
                      Cancel Invoice
                    </button>
                  )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-[18px] bg-[#F8FAFA] p-4 text-xs">
              <div>
                <p className="text-[10px] uppercase text-[#7D8C92]">Patient</p>
                <p className="font-semibold text-[#14191B]">
                  {activeInvoice.patientName} ({activeInvoice.patientId})
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[#7D8C92]">
                  Source Module Ref
                </p>
                <p className="font-semibold text-[#14191B]">
                  {activeInvoice.sourceReferenceId || "Direct Billing"}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6EDEF] text-[11px] uppercase text-[#6B7A80]">
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pr-3 text-right">Qty</th>
                    <th className="py-2 pr-3 text-right">Unit</th>
                    <th className="py-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F4]">
                  {activeInvoice.items.map((it, idx) => (
                    <tr key={`${activeInvoice.id}-it-${idx}`}>
                      <td className="py-2.5 pr-3 font-medium text-[#14191B]">
                        {it.description}
                      </td>
                      <td className="py-2.5 pr-3 text-right">{it.quantity}</td>
                      <td className="py-2.5 pr-3 text-right">
                        {formatMoney(it.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatMoney(it.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-[#E6EDEF] pt-3 text-xs">
              <div className="flex justify-between text-[#546369]">
                <span>Subtotal</span>
                <span>{formatMoney(activeInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#546369]">
                <span>Discount ({activeInvoice.discountPercent}%)</span>
                <span>-{formatMoney(activeInvoice.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-[#546369]">
                <span>Tax ({activeInvoice.taxPercent}%)</span>
                <span>{formatMoney(activeInvoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-[#181C1E] pt-2 text-sm font-bold text-[#14191B]">
                <span>Total Payable</span>
                <span>{formatMoney(activeInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[#1F6355]">
                <span>Paid</span>
                <span>{formatMoney(activeInvoice.paidAmount)}</span>
              </div>
              {activeInvoice.refundedAmount > 0 && (
                <div className="flex justify-between text-[#B8381B]">
                  <span>Refunded</span>
                  <span>-{formatMoney(activeInvoice.refundedAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#14191B]">
                <span>Outstanding Balance</span>
                <span>{formatMoney(activeInvoice.outstandingBalance)}</span>
              </div>
            </div>

            {activePayments.length > 0 && (
              <div className="mt-5 border-t border-[#E6EDEF] pt-4 text-xs">
                <p className="font-semibold text-[#14191B]">
                  Payment Receipts ({activePayments.length})
                </p>
                <div className="mt-2 space-y-1.5">
                  {activePayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-[14px] bg-[#F8FAFA] px-3 py-2"
                    >
                      <span>
                        <strong>{p.id}</strong> • {p.paymentType} (
                        {p.paymentMethod})
                        {p.referenceNumber ? ` • Ref ${p.referenceNumber}` : ""}
                      </span>
                      <span className="font-bold text-[#1F6355]">
                        {formatMoney(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-10 text-center text-xs text-[#7D8C92]">
            Select an invoice to view its itemized statement and payment
            receipts.
          </div>
        )}
      </div>
    </div>
  );
}
