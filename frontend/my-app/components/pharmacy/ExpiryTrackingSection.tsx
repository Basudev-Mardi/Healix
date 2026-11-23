"use client";

import React, { useState } from "react";
import type { PharmacyBatch, PharmacyMedicine } from "@/lib/pharmacy/types";
import {
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  PRIMARY_BTN_CLASS,
  daysUntil,
  formatDateTime,
  getPharmacyBadgeClass,
} from "./ui";

interface ExpiryTrackingSectionProps {
  medicines: PharmacyMedicine[];
  batches: PharmacyBatch[];
  canManageExpiry: boolean;
  onUpdateExpiryStatus: (payload: {
    batchId: string;
    status: "Expired" | "Quarantined" | "Disposed";
    reason: string;
  }) => Promise<void>;
}

export function ExpiryTrackingSection({
  medicines,
  batches,
  canManageExpiry,
  onUpdateExpiryStatus,
}: ExpiryTrackingSectionProps) {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const [warningDays, setWarningDays] = useState(60);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const categorized = batches.map((b) => {
    const remainingDays = daysUntil(b.expiryDate);
    let expiryBadge = "Healthy";
    if (
      b.status === "Expired" ||
      b.status === "Quarantined" ||
      b.status === "Disposed"
    ) {
      expiryBadge = b.status;
    } else if (remainingDays <= 0) {
      expiryBadge = "Expired";
    } else if (remainingDays <= warningDays) {
      expiryBadge = "Near Expiry";
    }
    return { batch: b, remainingDays, expiryBadge };
  });

  const alertItems = categorized.filter(
    (c) => c.expiryBadge !== "Healthy" && c.batch.status !== "Depleted"
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Expiry Monitoring & Disposal Control
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Expired batches are automatically blocked from FEFO dispensing.
            Quarantine or dispose of near-expiry/expired stock with audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs">
          <span className="font-semibold text-[#47565C]">Warning Window:</span>
          <select
            value={warningDays}
            onChange={(e) => setWarningDays(Number(e.target.value))}
            className="font-semibold text-[#14191B] focus:outline-none"
          >
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>180 Days</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {alertItems.map(({ batch, remainingDays, expiryBadge }) => {
          const med = medById.get(batch.medicineId);
          return (
            <div
              key={batch.id}
              className="rounded-[24px] border border-white/85 bg-[#EDF2F3] p-5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {batch.batchNumber}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getPharmacyBadgeClass(expiryBadge)}`}
                  >
                    {expiryBadge}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    Exp: {batch.expiryDate} (
                    {remainingDays <= 0
                      ? `${Math.abs(remainingDays)}d overdue`
                      : `${remainingDays}d left`}
                    )
                  </span>
                </div>
                <span className="font-bold text-[#14191B]">
                  Remaining: {batch.remainingQty} units
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {med?.medicineName ?? batch.medicineId} ({med?.medicineCode})
              </p>

              {canManageExpiry && batch.status !== "Disposed" && (
                <div className="mt-3 flex flex-col gap-2 border-t border-white/80 pt-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={reasonById[batch.id] ?? ""}
                    onChange={(e) =>
                      setReasonById((prev) => ({
                        ...prev,
                        [batch.id]: e.target.value,
                      }))
                    }
                    placeholder="Reason for quarantine or disposal..."
                    className={`${INPUT_CLASS} sm:flex-1`}
                  />
                  <div className="flex flex-wrap gap-2">
                    {batch.status !== "Quarantined" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateExpiryStatus({
                            batchId: batch.id,
                            status: "Quarantined",
                            reason:
                              reasonById[batch.id] ||
                              "Moved to expiry quarantine shelf",
                          })
                        }
                        className={PRIMARY_BTN_CLASS}
                      >
                        Quarantine
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateExpiryStatus({
                          batchId: batch.id,
                          status: "Disposed",
                          reason:
                            reasonById[batch.id] ||
                            "Disposed per pharmaceutical waste protocol",
                        })
                      }
                      className={DANGER_BTN_CLASS}
                    >
                      Dispose Stock
                    </button>
                  </div>
                </div>
              )}

              {batch.expiryHistory.length > 0 && (
                <div className="mt-2.5 space-y-1 border-t border-white/80 pt-2 text-[11px] text-[#6B7A80]">
                  {batch.expiryHistory.map((h, idx) => (
                    <p key={`${batch.id}-eh-${idx}`}>
                      <strong>{h.action}</strong> ({formatDateTime(h.timestamp)}
                      ) — {h.staff}: {h.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {alertItems.length === 0 && (
          <div className="rounded-[24px] border border-white/80 bg-[#EDF2F3] p-8 text-center text-xs text-[#7D8C92]">
            No expired, quarantined, or near-expiry batches within {warningDays}{" "}
            days.
          </div>
        )}
      </div>
    </div>
  );
}
