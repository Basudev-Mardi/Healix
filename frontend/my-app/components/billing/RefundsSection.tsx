"use client";

import React, { useState } from "react";
import type {
  BillingInvoice,
  BillingRefund,
  PaymentMethod,
} from "@/lib/billing/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  formatMoney,
  getBillingBadgeClass,
  printRefundReceiptPdf,
} from "./ui";

interface RefundsSectionProps {
  invoices: BillingInvoice[];
  refunds: BillingRefund[];
  canAuthorizeRefund: boolean;
  onProcessRefund: (payload: {
    invoiceId: string;
    refundType: "Full" | "Partial";
    amount: number;
    refundMethod: Exclude<PaymentMethod, "Insurance">;
    reason: string;
  }) => Promise<boolean>;
}

export function RefundsSection({
  invoices,
  refunds,
  canAuthorizeRefund,
  onProcessRefund,
}: RefundsSectionProps) {
  const refundableInvoices = invoices.filter(
    (i) => i.paidAmount - i.refundedAmount > 0.01
  );

  const [invoiceId, setInvoiceId] = useState(refundableInvoices[0]?.id ?? "");
  const [refundType, setRefundType] = useState<"Full" | "Partial">("Partial");
  const [amount, setAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<
    Exclude<PaymentMethod, "Insurance">
  >("Bank Transfer");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeInv = refundableInvoices.find(
    (i) => i.id === (invoiceId || refundableInvoices[0]?.id)
  );
  const maxRefundable = activeInv
    ? Math.max(0, activeInv.paidAmount - activeInv.refundedAmount)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInv) return;
    setSubmitting(true);
    try {
      const ok = await onProcessRefund({
        invoiceId: activeInv.id,
        refundType,
        amount: refundType === "Full" ? maxRefundable : Number(amount) || 0,
        refundMethod,
        reason,
      });
      if (ok) {
        setAmount("");
        setReason("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Authorized Refund Processing
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Requires Finance Manager or Admin authorization. Never overwrites
          original payments; updates invoice balance atomically and issues a
          printable receipt.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Paid / Partially Paid Invoice *</label>
            <select
              value={invoiceId || refundableInvoices[0]?.id || ""}
              onChange={(e) => setInvoiceId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canAuthorizeRefund || refundableInvoices.length === 0}
            >
              {refundableInvoices.length === 0 ? (
                <option value="">No refundable invoices</option>
              ) : (
                refundableInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} — {inv.patientName} (Refundable:{" "}
                    {formatMoney(inv.paidAmount - inv.refundedAmount)})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Refund Type *</label>
              <select
                value={refundType}
                onChange={(e) =>
                  setRefundType(e.target.value as "Full" | "Partial")
                }
                className={INPUT_CLASS}
                disabled={!canAuthorizeRefund}
              >
                <option value="Partial">Partial Refund</option>
                <option value="Full">Full Refund</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Refund Method *</label>
              <select
                value={refundMethod}
                onChange={(e) =>
                  setRefundMethod(
                    e.target.value as Exclude<PaymentMethod, "Insurance">
                  )
                }
                className={INPUT_CLASS}
                disabled={!canAuthorizeRefund}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>
              Refund Amount ($) — Max {formatMoney(maxRefundable)} *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxRefundable}
              required={refundType === "Partial"}
              value={refundType === "Full" ? maxRefundable.toFixed(2) : amount}
              onChange={(e) => setAmount(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canAuthorizeRefund || refundType === "Full"}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Refund Reason *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Cancelled test, excess advance deposit, billing correction..."
              className={INPUT_CLASS}
              disabled={!canAuthorizeRefund}
            />
          </div>

          <button
            type="submit"
            disabled={!canAuthorizeRefund || submitting || !activeInv}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Processing Refund..." : "Authorize & Issue Refund"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Refund Transaction History ({refunds.length})
        </h3>
        <div className="mt-4 space-y-3">
          {refunds.map((ref) => (
            <div
              key={ref.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {ref.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBillingBadgeClass("Refunded")}`}
                  >
                    {ref.refundType} • {formatMoney(ref.amount)}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    Invoice {ref.invoiceId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => printRefundReceiptPdf(ref)}
                  className={ACCENT_BTN_CLASS}
                >
                  Print Refund Receipt
                </button>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {ref.patientName} ({ref.patientId}) — via {ref.refundMethod}
              </p>
              <p className="mt-0.5 text-[#546369]">Reason: {ref.reason}</p>
              <p className="mt-1 text-[11px] text-[#7D8C92]">
                Authorized by {ref.authorizedBy} •{" "}
                {formatDateTime(ref.refundedAt)}
              </p>
            </div>
          ))}

          {refunds.length === 0 && (
            <p className="rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
              No refunds have been issued yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
