"use client";

import React, { useState } from "react";
import type {
  AmbulanceAuditLog,
  AmbulanceDriver,
  AmbulanceRequest,
  AmbulanceTrip,
  AmbulanceVehicle,
} from "@/lib/ambulance/types";
import { daysUntil, formatDateTime, getAmbulanceBadgeClass } from "./ui";

interface AmbulanceDashboardSectionProps {
  gpsConfigured: boolean;
  vehicles: AmbulanceVehicle[];
  drivers: AmbulanceDriver[];
  requests: AmbulanceRequest[];
  trips: AmbulanceTrip[];
  auditLogs: AmbulanceAuditLog[];
}

export function AmbulanceDashboardSection({
  gpsConfigured,
  vehicles,
  drivers,
  requests,
  trips,
  auditLogs,
}: AmbulanceDashboardSectionProps) {
  const [period, setPeriod] = useState<"All" | "Daily" | "Weekly" | "Monthly">(
    "All"
  );

  const nowMs = new Date().getTime();
  const scopedTrips = trips.filter((t) => {
    if (period === "All") return true;
    const ts = new Date(t.arrivalTime).getTime();
    if (period === "Daily") {
      return t.arrivalTime.slice(0, 10) === new Date().toISOString().slice(0, 10);
    }
    if (period === "Weekly") return ts >= nowMs - 7 * 86400000;
    return ts >= nowMs - 30 * 86400000;
  });

  const docAlerts: string[] = [];
  for (const v of vehicles) {
    if (v.maintenanceStatus === "Under Maintenance") {
      docAlerts.push(`${v.registrationNumber}: Under Maintenance`);
    }
    if (daysUntil(v.insuranceExpiry) <= 30) {
      docAlerts.push(
        `${v.registrationNumber}: Insurance expires ${v.insuranceExpiry}`
      );
    }
    if (daysUntil(v.fitnessCertExpiry) <= 30) {
      docAlerts.push(
        `${v.registrationNumber}: Fitness cert expires ${v.fitnessCertExpiry}`
      );
    }
  }
  for (const d of drivers) {
    if (daysUntil(d.licenseValidUntil) <= 30) {
      docAlerts.push(
        `Driver ${d.fullName}: License expires ${d.licenseValidUntil}`
      );
    }
  }

  const totalDistance = scopedTrips.reduce((s, t) => s + t.distanceKm, 0);
  const totalFuel = scopedTrips.reduce((s, t) => s + t.fuelUsedLiters, 0);

  return (
    <div className="space-y-5">
      {/* Compliance & GPS Integration Notice */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/85 bg-[#FDF3E7] p-4 text-xs text-[#9C5B14]">
          <p className="font-bold">
            Maintenance & Document Expiry Alerts (≤ 30d): {docAlerts.length}
          </p>
          <p className="mt-1">
            {docAlerts.length > 0
              ? docAlerts.join(" • ")
              : "All fleet insurance, fitness certificates, and driver licenses are valid > 30 days."}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/85 bg-[#EDF2F3] p-4 text-xs text-[#47565C]">
          <p className="font-bold text-[#14191B]">
            Live GPS Telemetry Status:{" "}
            {gpsConfigured ? "Connected" : "Not Configured (Timestamp Tracking Active)"}
          </p>
          <p className="mt-1">
            {gpsConfigured
              ? "External GPS provider credentials detected."
              : "Configure AMBULANCE_GPS_API_KEY in backend environment to enable live map coordinates. Real milestone timestamps are active."}
          </p>
        </div>
      </div>

      {/* Period Reports + Utilization */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#14191B]">
              Fleet Utilization & Trip Reports
            </h2>
            <p className="text-xs text-[#6B7A80]">
              {scopedTrips.length} trip(s) • {totalDistance.toFixed(1)} km total
              distance • {totalFuel.toFixed(1)} L fuel •{" "}
              {requests.filter((r) => r.status === "Cancelled").length}{" "}
              cancelled request(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Daily", "Weekly", "Monthly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  period === p
                    ? "bg-[#181C1E] text-white"
                    : "bg-white text-[#47565C]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#14191B]">
                  {v.registrationNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getAmbulanceBadgeClass(v.operationalStatus)}`}
                >
                  {v.operationalStatus}
                </span>
              </div>
              <p className="mt-1 text-[#546369]">
                {v.vehicleType} • {v.model}
              </p>
              <p className="mt-2 font-semibold text-[#4A90A4]">
                {v.totalTrips} trip(s) • {v.totalDistanceKm.toFixed(1)} km
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <h3 className="text-base font-semibold text-[#14191B]">
          Ambulance Operations Audit Log ({auditLogs.length})
        </h3>
        <div className="mt-3 space-y-2">
          {auditLogs.slice(0, 10).map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getAmbulanceBadgeClass(log.action)}`}
                >
                  {log.entityType} • {log.action}
                </span>
                <span className="font-semibold text-[#14191B]">
                  {log.entityId}
                </span>
                <span className="text-[#546369]">{log.details}</span>
              </div>
              <span className="text-[11px] text-[#7D8C92]">
                {log.actorName} • {formatDateTime(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
