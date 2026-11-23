"use client";

import React from "react";
import {
  BLOOD_COMPONENTS,
  BLOOD_GROUPS,
  type BloodAuditLog,
  type BloodDonor,
  type BloodRequest,
  type BloodTransfusion,
  type BloodUnit,
} from "@/lib/blood-bank/types";
import { daysUntil, formatDateTime, getBloodBadgeClass } from "./ui";

interface BloodBankDashboardSectionProps {
  donors: BloodDonor[];
  units: BloodUnit[];
  requests: BloodRequest[];
  transfusions: BloodTransfusion[];
  auditLogs: BloodAuditLog[];
}

export function BloodBankDashboardSection({
  donors,
  units,
  requests,
  transfusions,
  auditLogs,
}: BloodBankDashboardSectionProps) {
  const availableUnits = units.filter((u) => u.status === "Available");
  const reservedUnits = units.filter((u) => u.status === "Reserved");
  const issuedUnits = units.filter((u) => u.status === "Issued");
  const expiredUnits = units.filter((u) => u.status === "Expired");
  const nearExpiryUnits = availableUnits.filter(
    (u) => daysUntil(u.expiryDate) <= 7
  );
  const urgentPending = requests.filter(
    (r) =>
      (r.urgency === "Emergency" || r.urgency === "Urgent") &&
      (r.status === "Pending" || r.status === "Approved")
  );

  return (
    <div className="space-y-5">
      {/* Alerts Banner Row */}
      {(urgentPending.length > 0 ||
        nearExpiryUnits.length > 0 ||
        expiredUnits.length > 0) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-white/85 bg-[#FCEBE7] p-4 text-xs text-[#B8381B]">
            <p className="font-bold">
              Urgent / Emergency Requests: {urgentPending.length}
            </p>
            <p className="mt-0.5">
              {urgentPending.length > 0
                ? urgentPending
                    .map((r) => `${r.id} (${r.requestedBloodGroup} ${r.component})`)
                    .join(", ")
                : "No pending urgent requests"}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/85 bg-[#FDF3E7] p-4 text-xs text-[#9C5B14]">
            <p className="font-bold">
              Near-Expiry Units (≤ 7 days): {nearExpiryUnits.length}
            </p>
            <p className="mt-0.5">
              {nearExpiryUnits.length > 0
                ? nearExpiryUnits
                    .map((u) => `${u.id} (${u.bloodGroup} ${u.component})`)
                    .join(", ")
                : "All available units have > 7 days shelf life"}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/85 bg-[#EDF2F3] p-4 text-xs text-[#3B484D]">
            <p className="font-bold">
              Expired / Reserved / Issued: {expiredUnits.length} /{" "}
              {reservedUnits.length} / {issuedUnits.length}
            </p>
            <p className="mt-0.5">
              Total Donors: {donors.length} • Transfusions Recorded:{" "}
              {transfusions.length}
            </p>
          </div>
        </div>
      )}

      {/* 8-Blood-Group Inventory Matrix */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <h2 className="text-lg font-semibold text-[#14191B]">
          Blood Group Inventory Matrix (Low-Stock Threshold: &lt; 2 Units)
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BLOOD_GROUPS.map((bg) => {
            const avail = availableUnits.filter(
              (u) => u.bloodGroup === bg
            ).length;
            const low = avail < 2;
            return (
              <div
                key={bg}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-3.5 text-center"
              >
                <span className="inline-block rounded-full bg-[#181C1E] px-3 py-0.5 text-xs font-bold text-white">
                  {bg}
                </span>
                <p className="mt-2 text-2xl font-bold text-[#14191B]">{avail}</p>
                <p
                  className={`mt-1 text-[10px] font-semibold ${
                    avail === 0
                      ? "text-[#EF5B3A]"
                      : low
                        ? "text-[#EB9B52]"
                        : "text-[#1F6355]"
                  }`}
                >
                  {avail === 0 ? "Out of Stock" : low ? "Low Stock" : "Adequate"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Component-wise Breakdown + Request Summary */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-6">
          <h3 className="text-base font-semibold text-[#14191B]">
            Component-wise Inventory
          </h3>
          <div className="mt-3 space-y-2">
            {BLOOD_COMPONENTS.map((comp) => {
              const avail = availableUnits.filter(
                (u) => u.component === comp
              ).length;
              const testing = units.filter(
                (u) => u.component === comp && u.status === "Testing"
              ).length;
              const reserved = reservedUnits.filter(
                (u) => u.component === comp
              ).length;
              return (
                <div
                  key={comp}
                  className="flex items-center justify-between rounded-[16px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5 text-xs"
                >
                  <span className="font-semibold text-[#14191B]">{comp}</span>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-[#E4F4F0] px-2.5 py-0.5 font-semibold text-[#1F6355]">
                      Avail: {avail}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[#546369]">
                      Test: {testing} • Res: {reserved}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-6">
          <h3 className="text-base font-semibold text-[#14191B]">
            Traceability Audit Trail ({auditLogs.length})
          </h3>
          <div className="mt-3 space-y-2">
            {auditLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-white/90 bg-[#F8FAFA] px-3.5 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBloodBadgeClass(log.action)}`}
                  >
                    {log.entityType} • {log.action}
                  </span>
                  <span className="font-semibold text-[#14191B]">
                    {log.entityId}
                  </span>
                  <span className="text-[#546369]">{log.details}</span>
                </div>
                <span className="text-[10px] text-[#7D8C92]">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
