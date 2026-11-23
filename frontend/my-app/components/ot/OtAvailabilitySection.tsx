"use client";

import React from "react";
import type { OtSurgery, OtTheatre } from "@/lib/ot/types";
import { getOtBadgeClass } from "./ui";

interface OtAvailabilitySectionProps {
  theatres: OtTheatre[];
  surgeries: OtSurgery[];
  canUpdateStatus: boolean;
  onUpdateTheatreStatus: (theatreId: string, status: string) => Promise<void>;
}

export function OtAvailabilitySection({
  theatres,
  surgeries,
  canUpdateStatus,
  onUpdateTheatreStatus,
}: OtAvailabilitySectionProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <h2 className="text-lg font-semibold text-[#14191B]">
          Operation Theatre Availability &amp; Schedule
        </h2>
        <p className="text-xs text-[#6B7A80]">
          Track Available, Occupied, Reserved, Cleaning, and Maintenance suites
          with scheduled surgery blocks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {theatres.map((theatre) => {
          const suiteSurgeries = surgeries.filter(
            (s) =>
              s.theatreId === theatre.id &&
              s.status !== "Cancelled" &&
              s.status !== "Completed"
          );

          return (
            <div
              key={theatre.id}
              className="rounded-[26px] border border-white/85 bg-[#EDF2F3] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-xs font-semibold text-white">
                      {theatre.id}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${getOtBadgeClass(theatre.status)}`}
                    >
                      {theatre.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-[#14191B]">
                    {theatre.name}
                  </h3>
                  <p className="text-xs text-[#6B7A80]">
                    {theatre.specialty} • {theatre.location}
                  </p>
                </div>

                {canUpdateStatus && theatre.status !== "Occupied" && (
                  <select
                    aria-label={`Status for ${theatre.name}`}
                    value={theatre.status}
                    onChange={(e) =>
                      onUpdateTheatreStatus(theatre.id, e.target.value)
                    }
                    className="rounded-full border border-[#D4DFE2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B]"
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7A80]">
                  Upcoming / Active Bookings ({suiteSurgeries.length})
                </p>
                {suiteSurgeries.length === 0 ? (
                  <p className="rounded-[16px] bg-[#F8FAFA] px-3.5 py-2.5 text-xs text-[#738288]">
                    No active bookings in this suite.
                  </p>
                ) : (
                  suiteSurgeries.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-[16px] bg-white px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#14191B]">
                          {s.id} • {s.procedureName}
                        </p>
                        <p className="text-[11px] text-[#6B7A80]">
                          {s.patientName} • {s.scheduledDate} ({s.startTime}–
                          {s.endTime})
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getOtBadgeClass(s.status)}`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
