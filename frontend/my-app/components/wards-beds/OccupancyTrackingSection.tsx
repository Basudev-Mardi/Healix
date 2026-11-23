"use client";

import React from "react";
import type { WardBedState } from "@/lib/wards-beds/types";

interface OccupancyTrackingSectionProps {
  occupancy: WardBedState["occupancy"];
}

export function OccupancyTrackingSection({
  occupancy,
}: OccupancyTrackingSectionProps) {
  return (
    <div className="space-y-6">
      {/* Hospital-Wide Utilization Breakdown */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Real-Time Hospital Bed Occupancy
            </h2>
            <p className="text-xs text-[#6B7A80]">
              Synchronized automatically with allocations, transfers,
              discharges, and cleaning status.
            </p>
          </div>
          <span className="rounded-full bg-[#181C1E] px-4 py-1.5 text-xs font-semibold text-white">
            Utilization: {occupancy.utilizationRate}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Beds", val: occupancy.totalBeds, color: "bg-[#181C1E]" },
            { label: "Occupied", val: occupancy.occupiedBeds, color: "bg-[#8FC1CE]" },
            { label: "Available", val: occupancy.availableBeds, color: "bg-[#6AB4A4]" },
            { label: "Reserved", val: occupancy.reservedBeds, color: "bg-[#4A90A4]" },
            { label: "Under Cleaning", val: occupancy.cleaningBeds, color: "bg-[#EB9B52]" },
            { label: "Maintenance", val: occupancy.maintenanceBeds, color: "bg-[#EF5B3A]" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4"
            >
              <span
                className={`inline-block h-2 w-6 rounded-full ${item.color}`}
              />
              <p className="mt-2 text-2xl font-semibold text-[#14191B]">
                {item.val}
              </p>
              <p className="text-[11px] font-medium text-[#6B7A80]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Ward-Wise & Department-Wise Occupancy */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
          <h3 className="text-base font-semibold text-[#14191B]">
            Ward-Wise Occupancy
          </h3>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Utilization across configured hospital wards.
          </p>

          <div className="mt-4 space-y-3">
            {occupancy.wardOccupancy.map((row) => (
              <div
                key={row.wardId}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#14191B]">
                      {row.wardName}{" "}
                      <span className="font-normal text-[#738288]">
                        ({row.wardType})
                      </span>
                    </p>
                    <p className="text-[#6B7A80]">{row.department}</p>
                  </div>
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {row.utilizationPercent}%
                  </span>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#E2E9EB]">
                  <div
                    className="h-full rounded-full bg-[#4A90A4]"
                    style={{ width: `${row.utilizationPercent}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#546369]">
                  <span>Total: {row.totalBeds}</span>
                  <span>Occupied: {row.occupied}</span>
                  <span>Available: {row.available}</span>
                  <span>Unavailable: {row.unavailable}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-6">
          <h3 className="text-base font-semibold text-[#14191B]">
            Department-Wise Occupancy
          </h3>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Live bed utilization grouped by clinical department.
          </p>

          <div className="mt-4 space-y-3">
            {occupancy.departmentOccupancy.map((row) => (
              <div
                key={row.department}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#14191B]">
                    {row.department}
                  </p>
                  <span className="rounded-full bg-[#4A90A4] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {row.utilizationPercent}%
                  </span>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#E2E9EB]">
                  <div
                    className="h-full rounded-full bg-[#6AB4A4]"
                    style={{ width: `${row.utilizationPercent}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#546369]">
                  <span>Total: {row.totalBeds}</span>
                  <span>Occupied: {row.occupied}</span>
                  <span>Available: {row.available}</span>
                  <span>Unavailable: {row.unavailable}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
