"use client";

import React, { useState } from "react";
import type {
  BillingCategory,
  BillingInvoice,
  BillingPatient,
  BillingPayment,
  BillingSourceRecord,
  PaymentMethod,
} from "@/lib/billing/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatDateTime,
  formatMoney,
  getBillingBadgeClass,
  printInvoicePdf,
} from "./ui";

interface DraftItem {
  description: string;
  code: string;
  quantity: number;
  unitPrice: number;
}

interface DepartmentBillingSectionProps {
  category: BillingCategory;
  patients: BillingPatient[];
  sources: BillingSourceRecord[];
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  canCreate: boolean;
  canCollect: boolean;
  onCreateInvoice: (payload: {
    patientId: string;
    category: BillingCategory;
    sourceReferenceId: string;
    items: DraftItem[];
    discountPercent: number;
    taxPercent: number;
    depositApplied: number;
    notes: string;
  }) => Promise<boolean>;
  onCollectPayment: (payload: {
    invoiceId: string;
    amount: number;
    paymentType: "Full" | "Partial" | "Advance";
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes: string;
  }) => Promise<boolean>;
}

const DEFAULT_LINE_BY_CATEGORY: Record<BillingCategory, DraftItem[]> = {
  OPD: [
    {
      description: "OPD Specialist Consultation",
      code: "OPD-CONS",
      quantity: 1,
      unitPrice: 60,
    },
  ],
  IPD: [
    {
      description: "IPD Room / Bed Daily Charge",
      code: "IPD-BED",
      quantity: 2,
      unitPrice: 120,
    },
    {
      description: "Inpatient Nursing & Treatment",
      code: "IPD-TRT",
      quantity: 1,
      unitPrice: 180,
    },
  ],
  Surgery: [
    {
      description: "Operation Theatre & Surgeon Charges",
      code: "SRG-OT",
      quantity: 1,
      unitPrice: 1450,
    },
    {
      description: "Anesthesia & Surgical Consumables",
      code: "SRG-ANES",
      quantity: 1,
      unitPrice: 480,
    },
  ],
  Laboratory: [
    {
      description: "Diagnostic Lab Panel",
      code: "LAB-PNL",
      quantity: 1,
      unitPrice: 75,
    },
  ],
  Pharmacy: [
    {
      description: "Dispensed Prescription Medicines",
      code: "PHR-MED",
      quantity: 1,
      unitPrice: 35,
    },
  ],
};

export function DepartmentBillingSection({
  category,
  patients,
  sources,
  invoices,
  payments,
  canCreate,
  canCollect,
  onCreateInvoice,
  onCollectPayment,
}: DepartmentBillingSectionProps) {
  const categoryInvoices = invoices.filter((i) => i.category === category);

  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [items, setItems] = useState<DraftItem[]>(
    DEFAULT_LINE_BY_CATEGORY[category]
  );
  const [discountPercent, setDiscountPercent] = useState("0");
  const [taxPercent, setTaxPercent] = useState("5");
  const [depositApplied, setDepositApplied] = useState("0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Quick payment collection state per invoice
  const [payAmountById, setPayAmountById] = useState<Record<string, string>>(
    {}
  );
  const [payMethodById, setPayMethodById] = useState<
    Record<string, PaymentMethod>
  >({});
  const [payRefById, setPayRefById] = useState<Record<string, string>>({});

  function handleSelectSource(srcId: string) {
    setSelectedSourceId(srcId);
    const src = sources.find((s) => s.id === srcId);
    if (src) {
      setPatientId(src.patientId);
      if (src.suggestedItems.length > 0) {
        setItems(
          src.suggestedItems.map((it) => ({
            description: it.description,
            code: it.code ?? "",
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        );
      }
    }
  }

  function updateItem(idx: number, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      { description: "", code: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItemRow(idx: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  const previewSubtotal = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0),
    0
  );
  const previewDiscount =
    (previewSubtotal * Math.max(0, Number(discountPercent || 0))) / 100;
  const previewTax =
    ((previewSubtotal - previewDiscount) *
      Math.max(0, Number(taxPercent || 0))) /
    100;
  const previewTotal = previewSubtotal - previewDiscount + previewTax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onCreateInvoice({
        patientId: patientId || patients[0]?.id || "",
        category,
        sourceReferenceId: selectedSourceId,
        items,
        discountPercent: Number(discountPercent) || 0,
        taxPercent: Number(taxPercent) || 0,
        depositApplied: Number(depositApplied) || 0,
        notes,
      });
      if (ok) {
        setSelectedSourceId("");
        setDiscountPercent("0");
        setDepositApplied("0");
        setNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Bill Generator connected to Module Source Records */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Generate {category} Bill & Invoice
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Auto-import from existing {category} records or enter itemized charges
          with discounts, taxes, and deposits.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>
              Import from {category} Module (Optional)
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => handleSelectSource(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canCreate}
            >
              <option value="">— Direct / Manual {category} Bill —</option>
              {sources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Patient *</label>
            <select
              value={patientId || patients[0]?.id || ""}
              onChange={(e) => setPatientId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canCreate}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-2 rounded-[20px] border border-white/90 bg-[#F8FAFA] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#14191B]">
                Itemized Charges
              </span>
              <button
                type="button"
                onClick={addItemRow}
                disabled={!canCreate}
                className="text-xs font-semibold text-[#4A90A4] hover:underline"
              >
                + Add Charge
              </button>
            </div>
            {items.map((it, idx) => (
              <div
                key={`item-${idx}`}
                className="grid grid-cols-12 gap-1.5 text-xs"
              >
                <input
                  type="text"
                  required
                  value={it.description}
                  onChange={(e) =>
                    updateItem(idx, { description: e.target.value })
                  }
                  placeholder="Service / item description"
                  className="col-span-6 rounded-[12px] border border-[#DCE4E7] bg-white px-2.5 py-1.5"
                  disabled={!canCreate}
                />
                <input
                  type="number"
                  min="1"
                  required
                  value={it.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: Number(e.target.value) || 1 })
                  }
                  className="col-span-2 rounded-[12px] border border-[#DCE4E7] bg-white px-2 py-1.5 text-right"
                  disabled={!canCreate}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={it.unitPrice}
                  onChange={(e) =>
                    updateItem(idx, {
                      unitPrice: Number(e.target.value) || 0,
                    })
                  }
                  className="col-span-3 rounded-[12px] border border-[#DCE4E7] bg-white px-2 py-1.5 text-right"
                  disabled={!canCreate}
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  disabled={!canCreate || items.length === 1}
                  className="col-span-1 text-[#EF5B3A] disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Tax (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Deposit ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={depositApplied}
                onChange={(e) => setDepositApplied(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canCreate}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Billing Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Package notes, discharge bill remarks..."
              className={INPUT_CLASS}
              disabled={!canCreate}
            />
          </div>

          <div className="rounded-[18px] bg-white px-4 py-3 text-xs">
            <div className="flex justify-between text-[#546369]">
              <span>Subtotal</span>
              <span>{formatMoney(previewSubtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between font-bold text-[#14191B]">
              <span>Estimated Total (after discount & tax)</span>
              <span>{formatMoney(previewTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canCreate || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting
              ? `Generating ${category} Invoice...`
              : `Generate ${category} Invoice`}
          </button>
        </div>
      </form>

      {/* Right: Category Invoices & Payment Collection */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          {category} Bills & Invoices ({categoryInvoices.length})
        </h3>
        <div className="mt-4 space-y-3">
          {categoryInvoices.map((inv) => {
            const invPayments = payments.filter((p) => p.invoiceId === inv.id);
            return (
              <div
                key={inv.id}
                className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {inv.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBillingBadgeClass(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                    {inv.sourceReferenceId && (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                        Ref: {inv.sourceReferenceId}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => printInvoicePdf(inv, invPayments)}
                    className={SECONDARY_BTN_CLASS}
                  >
                    Print / PDF
                  </button>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {inv.patientName} ({inv.patientId}) • {inv.billNumber}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 rounded-[14px] bg-white p-2.5">
                  <div>
                    <p className="text-[10px] text-[#7D8C92]">Total</p>
                    <p className="font-bold text-[#14191B]">
                      {formatMoney(inv.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#7D8C92]">Paid</p>
                    <p className="font-bold text-[#1F6355]">
                      {formatMoney(inv.paidAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#7D8C92]">Outstanding</p>
                    <p className="font-bold text-[#B8381B]">
                      {formatMoney(inv.outstandingBalance)}
                    </p>
                  </div>
                </div>

                {canCollect &&
                  inv.outstandingBalance > 0 &&
                  inv.status !== "Cancelled" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E6EDEF] pt-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={inv.outstandingBalance}
                        value={
                          payAmountById[inv.id] ??
                          String(inv.outstandingBalance)
                        }
                        onChange={(e) =>
                          setPayAmountById((prev) => ({
                            ...prev,
                            [inv.id]: e.target.value,
                          }))
                        }
                        className="w-28 rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                      />
                      <select
                        value={payMethodById[inv.id] ?? "UPI"}
                        onChange={(e) =>
                          setPayMethodById((prev) => ({
                            ...prev,
                            [inv.id]: e.target.value as PaymentMethod,
                          }))
                        }
                        className="rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                      <input
                        type="text"
                        value={payRefById[inv.id] ?? ""}
                        onChange={(e) =>
                          setPayRefById((prev) => ({
                            ...prev,
                            [inv.id]: e.target.value,
                          }))
                        }
                        placeholder="Txn / Ref #"
                        className="w-32 rounded-full border border-[#DCE4E7] bg-white px-3 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const amt =
                            Number(
                              payAmountById[inv.id] ?? inv.outstandingBalance
                            ) || 0;
                          onCollectPayment({
                            invoiceId: inv.id,
                            amount: amt,
                            paymentType:
                              amt >= inv.outstandingBalance - 0.01
                                ? "Full"
                                : "Partial",
                            paymentMethod: payMethodById[inv.id] ?? "UPI",
                            referenceNumber: payRefById[inv.id] ?? "",
                            notes: `Collected from ${category} Billing desk`,
                          });
                        }}
                        className={ACCENT_BTN_CLASS}
                      >
                        Collect Payment
                      </button>
                    </div>
                  )}

                <p className="mt-2 text-[11px] text-[#7D8C92]">
                  Created {formatDateTime(inv.createdAt)} by {inv.createdBy}
                </p>
              </div>
            );
          })}

          {categoryInvoices.length === 0 && (
            <p className="rounded-[18px] bg-[#F8FAFA] py-8 text-center text-xs text-[#7D8C92]">
              No {category} invoices generated yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
