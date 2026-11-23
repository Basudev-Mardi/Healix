"use client";

import React, { useState } from "react";
import type {
  PharmacyBatch,
  PharmacyMedicine,
  PharmacyStockMovement,
} from "@/lib/pharmacy/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getPharmacyBadgeClass,
} from "./ui";

interface StockManagementSectionProps {
  medicines: PharmacyMedicine[];
  batches: PharmacyBatch[];
  movements: PharmacyStockMovement[];
  canManageStock: boolean;
  onAdjustStock: (payload: {
    batchId: string;
    quantityDelta: number;
    reason: string;
  }) => Promise<boolean>;
  onUpdateThreshold: (
    medicineId: string,
    minStockThreshold: number
  ) => Promise<void>;
}

export function StockManagementSection({
  medicines,
  batches,
  movements,
  canManageStock,
  onAdjustStock,
  onUpdateThreshold,
}: StockManagementSectionProps) {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const activeBatches = batches.filter(
    (b) => b.status === "Active" || b.status === "Depleted"
  );

  const [batchId, setBatchId] = useState(activeBatches[0]?.id ?? "");
  const [quantityDelta, setQuantityDelta] = useState("10");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [thresholdById, setThresholdById] = useState<Record<string, string>>(
    {}
  );

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    const targetBatchId = batchId || activeBatches[0]?.id || "";
    if (!targetBatchId) return;
    setSubmitting(true);
    try {
      const ok = await onAdjustStock({
        batchId: targetBatchId,
        quantityDelta: Number(quantityDelta),
        reason,
      });
      if (ok) {
        setReason("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Stock Levels & Thresholds */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <h2 className="text-lg font-semibold text-[#14191B]">
          Current Stock Levels & Low-Stock Alerts
        </h2>
        <p className="text-xs text-[#6B7A80]">
          Available stock reflects non-expired active batches automatically.
          Configure minimum thresholds to trigger low-stock alerts.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#14191B]">
                  {med.medicineCode}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getPharmacyBadgeClass(med.stockAlert)}`}
                >
                  {med.stockAlert}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#14191B]">
                {med.medicineName}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 rounded-[14px] bg-white p-2.5 text-center">
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Available</p>
                  <p className="font-bold text-[#14191B]">
                    {med.availableStock}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Reserved</p>
                  <p className="font-bold text-[#14191B]">{med.reservedQty}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Dispensed</p>
                  <p className="font-bold text-[#14191B]">{med.dispensedQty}</p>
                </div>
              </div>

              {canManageStock && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={
                      thresholdById[med.id] ?? String(med.minStockThreshold)
                    }
                    onChange={(e) =>
                      setThresholdById((prev) => ({
                        ...prev,
                        [med.id]: e.target.value,
                      }))
                    }
                    className="w-20 rounded-full border border-[#DCE4E7] bg-white px-3 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateThreshold(
                        med.id,
                        Number(
                          thresholdById[med.id] ?? med.minStockThreshold
                        ) || 0
                      )
                    }
                    className={ACCENT_BTN_CLASS}
                  >
                    Set Min
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Manual Stock Adjustment */}
        <form
          onSubmit={handleAdjust}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
        >
          <h3 className="text-base font-semibold text-[#14191B]">
            Stock Adjustment / Correction
          </h3>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Add or deduct batch units with a mandatory audit reason (e.g. cycle
            count, breakage, return).
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Target Batch *</label>
              <select
                value={batchId || activeBatches[0]?.id || ""}
                onChange={(e) => setBatchId(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canManageStock}
              >
                {activeBatches.map((b) => {
                  const med = medById.get(b.medicineId);
                  return (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} — {med?.medicineCode ?? b.medicineId} (Rem:{" "}
                      {b.remainingQty})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Quantity Delta (+ to add, - to deduct) *
              </label>
              <input
                type="number"
                required
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canManageStock}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Adjustment Reason *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Physical inventory count reconciliation"
                className={INPUT_CLASS}
                disabled={!canManageStock}
              />
            </div>

            <button
              type="submit"
              disabled={!canManageStock || submitting}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {submitting ? "Recording Adjustment..." : "Apply Stock Adjustment"}
            </button>
          </div>
        </form>

        {/* Right: Stock Movement Ledger */}
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
          <h3 className="text-base font-semibold text-[#14191B]">
            Stock Movement Ledger ({movements.length})
          </h3>
          <div className="mt-3 space-y-2">
            {movements.map((mov) => {
              const med = medById.get(mov.medicineId);
              return (
                <div
                  key={mov.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/90 bg-[#F8FAFA] px-4 py-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getPharmacyBadgeClass(mov.movementType)}`}
                      >
                        {mov.movementType}
                      </span>
                      <span className="font-semibold text-[#14191B]">
                        {med?.medicineName ?? mov.medicineId}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#6B7A80]">
                      {mov.reason} • By {mov.performedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        mov.quantityDelta >= 0
                          ? "text-[#1F6355]"
                          : "text-[#B8381B]"
                      }`}
                    >
                      {mov.quantityDelta >= 0
                        ? `+${mov.quantityDelta}`
                        : mov.quantityDelta}
                    </p>
                    <p className="text-[10px] text-[#7D8C92]">
                      Bal: {mov.balanceAfter} • {formatDateTime(mov.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
