"use client";

import React from "react";
import type { LabSample } from "@/lib/lab/types";
import {
  ACCENT_BTN_CLASS,
  PRIMARY_BTN_CLASS,
  formatDateTime,
  getLabBadgeClass,
} from "./ui";

interface SampleTrackingSectionProps {
  samples: LabSample[];
  canTrack: boolean;
  onAdvanceSample: (payload: {
    sampleId: string;
    status: "Collected" | "Received" | "Processing" | "Rejected" | "Completed";
    note?: string;
    rejectionReason?: string;
  }) => Promise<void>;
}

export function SampleTrackingSection({
  samples,
  canTrack,
  onAdvanceSample,
}: SampleTrackingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <h2 className="text-lg font-semibold text-[#14191B]">
          End-to-End Sample Tracking
        </h2>
        <p className="text-xs text-[#6B7A80]">
          Track every specimen across Collected → Received → Processing →
          Completed with full timestamped chain-of-custody history.
        </p>
      </div>

      {samples.map((smp) => (
        <div
          key={smp.id}
          className="rounded-[26px] border border-white/85 bg-[#EDF2F3] p-5 text-xs"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {smp.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getLabBadgeClass(smp.status)}`}
                >
                  {smp.status}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#546369]">
                  Request {smp.requestId} • Patient {smp.patientId}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {smp.specimenType}
              </p>
            </div>

            {canTrack &&
              smp.status !== "Completed" &&
              smp.status !== "Rejected" && (
                <div className="flex flex-wrap gap-2">
                  {smp.status === "Collected" && (
                    <button
                      type="button"
                      onClick={() =>
                        onAdvanceSample({
                          sampleId: smp.id,
                          status: "Received",
                          note: "Received & accessioned at lab bench",
                        })
                      }
                      className={ACCENT_BTN_CLASS}
                    >
                      Mark Received
                    </button>
                  )}
                  {(smp.status === "Collected" ||
                    smp.status === "Received") && (
                    <button
                      type="button"
                      onClick={() =>
                        onAdvanceSample({
                          sampleId: smp.id,
                          status: "Processing",
                          note: "Loaded for diagnostic analysis",
                        })
                      }
                      className={PRIMARY_BTN_CLASS}
                    >
                      Start Processing
                    </button>
                  )}
                  {smp.status === "Processing" && (
                    <button
                      type="button"
                      onClick={() =>
                        onAdvanceSample({
                          sampleId: smp.id,
                          status: "Completed",
                          note: "Sample analysis completed",
                        })
                      }
                      className={PRIMARY_BTN_CLASS}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              )}
          </div>

          {/* Chain-of-Custody Timeline */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {smp.trackingHistory.map((entry, idx) => (
              <div
                key={`${smp.id}-${idx}`}
                className="rounded-[16px] bg-white p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getLabBadgeClass(entry.stage)}`}
                  >
                    {entry.stage}
                  </span>
                  <span className="text-[10px] text-[#7A898F]">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>
                <p className="mt-1.5 font-semibold text-[#14191B]">
                  {entry.staff}
                </p>
                <p className="text-[11px] text-[#6B7A80]">{entry.note}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
