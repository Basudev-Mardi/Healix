"use client";

import React, { useState } from "react";
import type {
  PharmacyBatch,
  PharmacyDispensing,
  PharmacyPrescription,
} from "@/lib/pharmacy/types";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getPharmacyBadgeClass,
} from "./ui";

interface MedicineDispensingSectionProps {
  prescriptions: PharmacyPrescription[];
  batches: PharmacyBatch[];
  dispensings: PharmacyDispensing[];
  preselectedPrescriptionId?: string;
  canDispense: boolean;
  onDispense: (payload: {
    prescriptionId: string;
    medicineId: string;
    quantity: number;
    dosageInstructions: string;
    dispensedBy: string;
    allowPartial: boolean;
  }) => Promise<boolean>;
}

export function MedicineDispensingSection({
  prescriptions,
  batches,
  dispensings,
  preselectedPrescriptionId,
  canDispense,
  onDispense,
}: MedicineDispensingSectionProps) {
  const openPrescriptions = prescriptions.filter(
    (rx) => rx.status !== "Completed" && rx.status !== "Cancelled"
  );

  const [selectedRxId, setSelectedRxId] = useState(
    preselectedPrescriptionId ?? ""
  );
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dosageInstructions, setDosageInstructions] = useState("");
  const [dispensedBy, setDispensedBy] = useState("Pharmacist Ritu");
  const [allowPartial, setAllowPartial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const activeRxId =
    selectedRxId && openPrescriptions.some((r) => r.id === selectedRxId)
      ? selectedRxId
      : preselectedPrescriptionId &&
          openPrescriptions.some((r) => r.id === preselectedPrescriptionId)
        ? preselectedPrescriptionId
        : (openPrescriptions[0]?.id ?? "");

  const activeRx = openPrescriptions.find((r) => r.id === activeRxId);
  const remainingItems =
    activeRx?.items.filter((i) => i.dispensedQty < i.prescribedQty) ?? [];

  const activeMedId =
    selectedMedicineId &&
    remainingItems.some((i) => i.medicineId === selectedMedicineId)
      ? selectedMedicineId
      : (remainingItems[0]?.medicineId ?? "");

  const activeItem = remainingItems.find((i) => i.medicineId === activeMedId);
  const remainingNeeded = activeItem
    ? activeItem.prescribedQty - activeItem.dispensedQty
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const fefoBatches = batches
    .filter(
      (b) =>
        b.medicineId === activeMedId &&
        b.status === "Active" &&
        b.remainingQty > 0 &&
        b.expiryDate > today
    )
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const totalAvail = fefoBatches.reduce((sum, b) => sum + b.remainingQty, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRxId || !activeMedId) return;
    setSubmitting(true);
    try {
      const qtyNum = Number(quantity) || remainingNeeded;
      const ok = await onDispense({
        prescriptionId: activeRxId,
        medicineId: activeMedId,
        quantity: qtyNum,
        dosageInstructions,
        dispensedBy,
        allowPartial,
      });
      if (ok) {
        setQuantity("");
        setDosageInstructions("");
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
          FEFO Medicine Dispensing
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Automatically selects the earliest non-expired batch (FEFO), blocks
          expired stock, supports partial dispensing, and updates inventory.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Open Prescription *</label>
            <select
              value={activeRxId}
              onChange={(e) => {
                setSelectedRxId(e.target.value);
                setSelectedMedicineId("");
              }}
              className={INPUT_CLASS}
              disabled={!canDispense || openPrescriptions.length === 0}
            >
              {openPrescriptions.length === 0 ? (
                <option value="">No open prescriptions</option>
              ) : (
                openPrescriptions.map((rx) => (
                  <option key={rx.id} value={rx.id}>
                    {rx.id} — {rx.patientName} ({rx.status})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Prescribed Medicine *</label>
            <select
              value={activeMedId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canDispense || remainingItems.length === 0}
            >
              {remainingItems.map((it) => (
                <option key={it.medicineId} value={it.medicineId}>
                  {it.medicineCode} — {it.medicineName} (Remaining:{" "}
                  {it.prescribedQty - it.dispensedQty})
                </option>
              ))}
            </select>
          </div>

          {activeItem && (
            <div className="rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3 text-xs">
              <p className="font-semibold text-[#14191B]">
                FEFO Batch Preview (Available: {totalAvail} • Needed:{" "}
                {remainingNeeded})
              </p>
              {fefoBatches.length > 0 ? (
                <div className="mt-1.5 space-y-1 text-[11px] text-[#546369]">
                  {fefoBatches.map((b, idx) => (
                    <p key={b.id}>
                      {idx === 0 ? "★ Next FEFO: " : "• "}
                      <strong>{b.batchNumber}</strong> — {b.remainingQty} units
                      (Exp: {b.expiryDate})
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 font-medium text-[#B8381B]">
                  No active non-expired batches available for this medicine.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Quantity to Dispense *</label>
              <input
                type="number"
                min="1"
                max={remainingNeeded || undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={String(remainingNeeded || 1)}
                className={INPUT_CLASS}
                disabled={!canDispense || !activeItem}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Dispensing Staff *</label>
              <input
                type="text"
                required
                value={dispensedBy}
                onChange={(e) => setDispensedBy(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canDispense}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Patient Dosage Instructions</label>
            <input
              type="text"
              value={dosageInstructions}
              onChange={(e) => setDosageInstructions(e.target.value)}
              placeholder={
                activeItem
                  ? `${activeItem.dosage} ${activeItem.frequency} x ${activeItem.duration}`
                  : "Dosage counseling instructions..."
              }
              className={INPUT_CLASS}
              disabled={!canDispense}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-[#47565C]">
            <input
              type="checkbox"
              checked={allowPartial}
              onChange={(e) => setAllowPartial(e.target.checked)}
              disabled={!canDispense}
            />
            Allow partial dispensing if stock is less than prescribed quantity
          </label>

          <button
            type="submit"
            disabled={
              !canDispense ||
              submitting ||
              !activeRxId ||
              !activeMedId ||
              totalAvail === 0
            }
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Dispensing via FEFO..." : "Dispense Medicine"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Dispensing History ({dispensings.length})
        </h3>
        <div className="mt-4 space-y-2.5">
          {dispensings.map((dsp) => (
            <div
              key={dsp.id}
              className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {dsp.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPharmacyBadgeClass("Dispensed")}`}
                  >
                    Qty {dsp.quantityDispensed}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#47565C]">
                    Batch {dsp.batchNumber} (Exp {dsp.expiryDate})
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7A80]">
                  {formatDateTime(dsp.dispensedAt)}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {dsp.medicineName} → {dsp.patientName} ({dsp.patientId})
              </p>
              <p className="mt-0.5 text-[#546369]">
                Rx {dsp.prescriptionId} • Dispensed by{" "}
                <strong>{dsp.dispensedBy}</strong>
              </p>
              {dsp.dosageInstructions && (
                <p className="mt-1 text-[#4A90A4]">
                  Instructions: {dsp.dosageInstructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
