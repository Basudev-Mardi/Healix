"use client";

import React, { useState } from "react";
import type { AmbulanceTrip } from "@/lib/ambulance/types";
import { formatDateTime, getAmbulanceBadgeClass } from "./ui";

interface TripRecordsSectionProps {
  trips: AmbulanceTrip[];
}

export function TripRecordsSection({ trips }: TripRecordsSectionProps) {
  const [driverFilter, setDriverFilter] = useState("All");
  const drivers = Array.from(new Set(trips.map((t) => t.driverName)));
  const filtered = trips.filter((t) =>
    driverFilter === "All" ? true : t.driverName === driverFilter
  );

  return (
    <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Complete Ambulance Trip Records ({filtered.length})
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Automatically generated upon dispatch completion with departure,
            arrival, distance, duration, and fuel usage.
          </p>
        </div>
        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
          className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold"
        >
          <option value="All">All Drivers</option>
          {drivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {t.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getAmbulanceBadgeClass(t.tripStatus)}`}
                >
                  {t.tripStatus}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                  {t.registrationNumber} • Driver: {t.driverName}
                </span>
              </div>
              <span className="font-bold text-[#14191B]">
                {t.distanceKm} km • {t.durationMins} mins • {t.fuelUsedLiters} L
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-[#14191B]">
              Patient: {t.patientName} (Req {t.requestId})
            </p>
            <p className="mt-0.5 text-[#546369]">
              Route: {t.pickupLocation} → {t.dropoffLocation}
            </p>
            <p className="mt-0.5 text-[11px] text-[#6B7A80]">
              Departed {formatDateTime(t.departureTime)} • Arrived{" "}
              {formatDateTime(t.arrivalTime)}
            </p>
            {t.remarks && (
              <p className="mt-1 text-[#4A90A4]">Remarks: {t.remarks}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
