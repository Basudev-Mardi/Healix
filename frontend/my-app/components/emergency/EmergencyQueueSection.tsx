"use client";

import React, { useMemo } from "react";
import type {
  EmergencyQueueStatus,
  EmergencyRegistration,
  TriageLevel,
} from "@/lib/emergency/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatTimeShort,
  getEmergencyBadgeClass,
} from "./ui";

interface EmergencyQueueSectionProps {
  registrations: EmergencyRegistration[];
  canManage: boolean;
  onUpdateStatus: (
    emergencyId: string,
    queueStatus: EmergencyQueueStatus
  ) => Promise<void>;
  onNavigateCase: (
    tab: "triage" | "trauma" | "treatment" | "alerts" | "transfers",
    emergencyId: string
  ) => void;
}

const PRIORITY_RANK: Record<TriageLevel | "Unassessed", number> = {
  "Level 1 - Resuscitation": 1,
  "Level 2 - Emergent": 2,
  "Level 3 - Urgent": 3,
  "Level 4 - Less Urgent": 4,
  "Level 5 - Non-Urgent": 5,
  Unassessed: 6,
};

export function EmergencyQueueSection({
  registrations,
  canManage,
  onUpdateStatus,
  onNavigateCase,
}: EmergencyQueueSectionProps) {
  const sorted = useMemo(
    () =>
      [...registrations].sort((a, b) => {
        const diff = PRIORITY_RANK[a.triageLevel] - PRIORITY_RANK[b.triageLevel];
        if (diff !== 0) return diff;
        return a.arrivalTime.localeCompare(b.arrivalTime);
      }),
    [registrations]
  );

  const waiting = sorted.filter((r) => r.queueStatus === "Waiting");
  const underTreatment = sorted.filter(
    (r) =>
      r.queueStatus === "Under Treatment" || r.queueStatus === "Stabilized"
  );
  const completed = sorted.filter(
    (r) => r.queueStatus === "Completed" || r.queueStatus === "Transferred"
  );

  const renderCard = (reg: EmergencyRegistration) => {
    const isCritical =
      reg.triageLevel === "Level 1 - Resuscitation" ||
      reg.triageLevel === "Level 2 - Emergent";

    return (
      <div
        key={reg.id}
        className={`rounded-[22px] border p-4 ${
          isCritical
            ? "border-[#EF5B3A]/45 bg-white"
            : "border-white/90 bg-[#F8FAFA]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
              {reg.id}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmergencyBadgeClass(reg.triageLevel)}`}
            >
              {reg.triageLevel}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#5A686E]">
            {reg.assignedBay}
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold text-[#14191B]">
          {reg.patientName}{" "}
          <span className="font-normal text-[#738288]">({reg.patientId})</span>
        </p>
        <p className="text-xs text-[#6B7A80]">
          {reg.emergencyType} • {reg.arrivalMode} •{" "}
          {formatTimeShort(reg.arrivalTime)}
        </p>
        <p className="mt-1 text-xs text-[#4C5B61]">
          {reg.presentingComplaints}
        </p>

        {/* Queue Status Actions */}
        {canManage &&
          reg.queueStatus !== "Completed" &&
          reg.queueStatus !== "Transferred" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {reg.queueStatus === "Waiting" && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(reg.id, "Under Treatment")}
                  className={ACCENT_BTN_CLASS}
                >
                  Start Treatment
                </button>
              )}
              {reg.queueStatus === "Under Treatment" && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(reg.id, "Stabilized")}
                  className={SECONDARY_BTN_CLASS}
                >
                  Mark Stabilized
                </button>
              )}
              <button
                type="button"
                onClick={() => onUpdateStatus(reg.id, "Completed")}
                className={SECONDARY_BTN_CLASS}
              >
                Complete
              </button>
            </div>
          )}

        {/* Quick Workflow Handoffs */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#E6ECEE] pt-3">
          <button
            type="button"
            onClick={() => onNavigateCase("triage", reg.id)}
            className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
          >
            Triage
          </button>
          <button
            type="button"
            onClick={() => onNavigateCase("trauma", reg.id)}
            className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
          >
            Trauma
          </button>
          <button
            type="button"
            onClick={() => onNavigateCase("treatment", reg.id)}
            className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
          >
            Treatment
          </button>
          <button
            type="button"
            onClick={() => onNavigateCase("alerts", reg.id)}
            className={
              isCritical
                ? `${DANGER_BTN_CLASS} !px-2.5 !py-1 !text-[11px]`
                : "rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
            }
          >
            Alert
          </button>
          <button
            type="button"
            onClick={() => onNavigateCase("transfers", reg.id)}
            className="rounded-full bg-[#EDF2F3] px-2.5 py-1 text-[11px] font-semibold text-[#3C4A50] hover:bg-[#DCE4E7]"
          >
            Transfer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Waiting */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#14191B]">
              Waiting (Priority Ordered)
            </h2>
            <p className="text-[11px] text-[#6B7A80]">
              Level 1 &amp; Level 2 cases automatically pinned first.
            </p>
          </div>
          <span className="rounded-full bg-[#8FC1CE] px-3 py-0.5 text-xs font-semibold text-white">
            {waiting.length}
          </span>
        </div>
        <div className="space-y-3">
          {waiting.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-center text-xs text-[#738288]">
              No emergency patients waiting.
            </p>
          ) : (
            waiting.map(renderCard)
          )}
        </div>
      </div>

      {/* Under Treatment / Stabilized */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#14191B]">
              Under Treatment / Stabilized
            </h2>
            <p className="text-[11px] text-[#6B7A80]">
              Active resuscitation &amp; emergency bay management.
            </p>
          </div>
          <span className="rounded-full bg-[#EB9B52] px-3 py-0.5 text-xs font-semibold text-white">
            {underTreatment.length}
          </span>
        </div>
        <div className="space-y-3">
          {underTreatment.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-center text-xs text-[#738288]">
              No active patients under treatment.
            </p>
          ) : (
            underTreatment.map(renderCard)
          )}
        </div>
      </div>

      {/* Transferred / Completed */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#14191B]">
              Transferred / Completed
            </h2>
            <p className="text-[11px] text-[#6B7A80]">
              Discharged or handed over to ICU, OT, or Ward.
            </p>
          </div>
          <span className="rounded-full bg-[#6AB4A4] px-3 py-0.5 text-xs font-semibold text-white">
            {completed.length}
          </span>
        </div>
        <div className="space-y-3">
          {completed.length === 0 ? (
            <p className="rounded-[18px] bg-[#F8FAFA] p-4 text-center text-xs text-[#738288]">
              No completed or transferred emergency cases yet.
            </p>
          ) : (
            completed.map(renderCard)
          )}
        </div>
      </div>
    </div>
  );
}
