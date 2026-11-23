"use client";

import React, { useMemo, useState } from "react";
import type { BedRecord, WardRecord } from "@/lib/wards-beds/types";
import { getBedBadgeClass } from "./ui";

interface BedAvailabilitySectionProps {
  wards: WardRecord[];
  beds: BedRecord[];
  canUpdateStatus: boolean;
  onUpdateBedStatus: (
    bedId: string,
    status: "Available" | "Reserved" | "Under Cleaning" | "Maintenance"
  ) => Promise<void>;
}

export function BedAvailabilitySection({
  wards,
  beds,
  canUpdateStatus,
  onUpdateBedStatus,
}: BedAvailabilitySectionProps) {
  const [wardFilter, setWardFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const departments = useMemo(
    () => Array.from(new Set(beds.map((b) => b.department))),
    [beds]
  );
  const bedTypes = useMemo(
    () => Array.from(new Set(beds.map((b) => b.bedType))),
    [beds]
  );

  const filteredBeds = useMemo(
    () =>
      beds.filter((b) => {
        if (wardFilter !== "All" && b.ward !== wardFilter) return false;
        if (deptFilter !== "All" && b.department !== deptFilter) return false;
        if (typeFilter !== "All" && b.bedType !== typeFilter) return false;
        if (statusFilter !== "All" && b.status !== statusFilter) return false;
        return true;
      }),
    [beds, wardFilter, deptFilter, typeFilter, statusFilter]
  );

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#14191B]">
            Live Bed Availability Board
          </h2>
          <p className="text-xs text-[#6B7A80]">
            Filter by ward, department, bed type, and status. Beds under
            cleaning or maintenance are locked from allocation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-3.5 py-2 text-xs font-medium text-[#14191B]"
          >
            <option value="All">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-3.5 py-2 text-xs font-medium text-[#14191B]"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-3.5 py-2 text-xs font-medium text-[#14191B]"
          >
            <option value="All">All Types</option>
            {bedTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-white bg-white px-3.5 py-2 text-xs font-medium text-[#14191B]"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Reserved">Reserved</option>
            <option value="Under Cleaning">Under Cleaning</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBeds.map((bed) => (
          <div
            key={bed.id}
            className="flex flex-col justify-between rounded-[24px] border border-white/85 bg-[#EDF2F3] p-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-xs font-semibold text-white">
                  {bed.bedNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBedBadgeClass(bed.status)}`}
                >
                  {bed.status}
                </span>
              </div>

              <p className="mt-2.5 text-sm font-semibold text-[#14191B]">
                {bed.ward} • {bed.room}
              </p>
              <p className="text-xs text-[#6B7A80]">
                {bed.department} • {bed.bedType}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {bed.isIsolation && (
                  <span className="rounded-full bg-[#EF5B3A]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#A32E14]">
                    Isolation ({bed.isolationType})
                  </span>
                )}
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#546369]">
                  Cleaning: {bed.cleaningStatus}
                </span>
              </div>

              {bed.currentAdmissionId && (
                <p className="mt-2 rounded-[12px] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1E505E]">
                  Occupied by {bed.currentAdmissionId}
                </p>
              )}
            </div>

            {canUpdateStatus && bed.status !== "Occupied" && (
              <div className="mt-3 border-t border-white pt-3">
                <select
                  aria-label={`Change status for ${bed.bedNumber}`}
                  value={bed.status}
                  onChange={(e) =>
                    onUpdateBedStatus(
                      bed.id,
                      e.target.value as
                        | "Available"
                        | "Reserved"
                        | "Under Cleaning"
                        | "Maintenance"
                    )
                  }
                  className="w-full rounded-full border border-[#D4DFE2] bg-white px-3 py-1.5 text-xs font-semibold text-[#14191B]"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Under Cleaning">Under Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
