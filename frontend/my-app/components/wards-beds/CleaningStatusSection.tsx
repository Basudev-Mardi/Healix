"use client";

import React from "react";
import type { BedCleaningLog } from "@/lib/wards-beds/types";
import {
  ACCENT_BTN_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getBedBadgeClass,
} from "./ui";

interface CleaningStatusSectionProps {
  cleaningLogs: BedCleaningLog[];
  canManage: boolean;
  onUpdateCleaning: (payload: {
    cleaningLogId: string;
    action: "start" | "complete";
  }) => Promise<void>;
}

export function CleaningStatusSection({
  cleaningLogs,
  canManage,
  onUpdateCleaning,
}: CleaningStatusSectionProps) {
  const pending = cleaningLogs.filter(
    (l) => l.cleaningStatus === "Pending Cleaning"
  );
  const inProgress = cleaningLogs.filter(
    (l) => l.cleaningStatus === "Cleaning in Progress"
  );
  const cleaned = cleaningLogs.filter((l) => l.cleaningStatus === "Cleaned");

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Bed Cleaning &amp; Sanitization Tracker
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Beds remain locked from allocation until terminal cleaning is
              marked Completed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[#EB9B52] px-3 py-1 text-white">
              {pending.length} Pending
            </span>
            <span className="rounded-full bg-[#8FC1CE] px-3 py-1 text-white">
              {inProgress.length} In Progress
            </span>
            <span className="rounded-full bg-[#6AB4A4] px-3 py-1 text-white">
              {cleaned.length} Cleaned
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {cleaningLogs.length === 0 ? (
          <p className="rounded-[24px] bg-[#EDF2F3] p-8 text-center text-xs text-[#738288]">
            No bed cleaning logs recorded yet.
          </p>
        ) : (
          cleaningLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-[24px] border border-white/85 bg-[#EDF2F3] p-5 text-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {log.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBedBadgeClass(log.cleaningStatus)}`}
                    >
                      {log.cleaningStatus}
                    </span>
                    {log.isIsolationBed && (
                      <span className="rounded-full bg-[#EF5B3A] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        Isolation Protocol
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[#14191B]">
                    Bed {log.bedNumber} ({log.bedId}) — {log.wardName}
                  </p>
                  <p className="text-[#546369]">
                    Protocol: <strong>{log.sanitizationProtocol}</strong> •
                    Staff: {log.responsibleStaff}
                  </p>
                  {log.notes && (
                    <p className="mt-1 text-[#6B7A80]">{log.notes}</p>
                  )}
                  <p className="mt-1 text-[11px] text-[#7D8C92]">
                    Queued {formatDateTime(log.createdAt)}
                    {log.startedAt
                      ? ` • Started ${formatDateTime(log.startedAt)}`
                      : ""}
                    {log.completedAt
                      ? ` • Completed ${formatDateTime(log.completedAt)}`
                      : ""}
                  </p>
                </div>

                {canManage && log.cleaningStatus !== "Cleaned" && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {log.cleaningStatus === "Pending Cleaning" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCleaning({
                            cleaningLogId: log.id,
                            action: "start",
                          })
                        }
                        className={ACCENT_BTN_CLASS}
                      >
                        Start Cleaning
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCleaning({
                          cleaningLogId: log.id,
                          action: "complete",
                        })
                      }
                      className={PRIMARY_BTN_CLASS}
                    >
                      Mark Cleaned &amp; Available
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
