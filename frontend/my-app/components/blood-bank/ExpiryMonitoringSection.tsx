"use client";

import React, { useState } from "react";
import type { BloodUnit } from "@/lib/blood-bank/types";
import { DANGER_BTN_CLASS, daysUntil, getBloodBadgeClass } from "./ui";

interface ExpiryMonitoringSectionProps {
  units: BloodUnit[];
  canDiscard: boolean;
  onDiscardUnit: (unitId: string, reason: string) => Promise<void>;
}

export function ExpiryMonitoringSection({
  units,
  canDiscard,
  onDiscardUnit,
}: ExpiryMonitoringSectionProps) {
  const [warningDays, setWarningDays] = useState(7);

  const monitored = units
    .filter(
      (u) => u.status !== "Transfused" && u.status !== "Discarded"
    )
    .map((u) => {
      const daysLeft = daysUntil(u.expiryDate);
      const alertLabel =
        u.status === "Expired" || daysLeft <= 0
          ? "Expired"
          : daysLeft <= warningDays
            ? "Near Expiry"
            : u.status;
      return { unit: u, daysLeft, alertLabel };
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Blood Unit Shelf-Life & Expiry Monitoring
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Tracks component-specific expiry (Platelets 5d, Whole Blood 35d, RBC
            42d, Plasma/Cryo 365d) and blocks expired units from issuing.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs">
          <span className="font-semibold text-[#47565C]">Alert Window:</span>
          <select
            value={warningDays}
            onChange={(e) => setWarningDays(Number(e.target.value))}
            className="font-semibold text-[#14191B] focus:outline-none"
          >
            <option value={5}>5 Days</option>
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </div>
      </div>

      <div className="space-y-2.5">
        {monitored.map(({ unit, daysLeft, alertLabel }) => (
          <div
            key={unit.id}
            className="flex flex-col gap-3 rounded-[22px] border border-white/85 bg-[#EDF2F3] p-4 text-xs sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {unit.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBloodBadgeClass(alertLabel)}`}
                >
                  {alertLabel}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                  {unit.bloodGroup} • {unit.component}
                </span>
              </div>
              <p className="mt-1.5 text-[#546369]">
                Collected {unit.collectionDate} •{" "}
                <strong>Expires {unit.expiryDate}</strong> (
                {daysLeft <= 0
                  ? `${Math.abs(daysLeft)}d expired`
                  : `${daysLeft}d remaining`}
                ) • {unit.storageLocation} ({unit.storageTemp})
              </p>
            </div>

            {canDiscard &&
              (alertLabel === "Expired" || alertLabel === "Near Expiry") && (
                <button
                  type="button"
                  onClick={() =>
                    onDiscardUnit(
                      unit.id,
                      alertLabel === "Expired"
                        ? "Expired blood unit biomedical disposal"
                        : "Near-expiry unit removed from active shelf"
                    )
                  }
                  className={DANGER_BTN_CLASS}
                >
                  Discard Unit
                </button>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
