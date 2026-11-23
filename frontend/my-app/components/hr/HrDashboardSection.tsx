"use client";

import React from "react";
import type {
  HrAttendance,
  HrAuditLog,
  HrEmployee,
  HrLeave,
  HrPayroll,
  HrPerformanceReview,
} from "@/lib/hr/types";
import { formatDateTime, formatMoney, getHrBadgeClass } from "./ui";

interface HrDashboardSectionProps {
  employees: HrEmployee[];
  attendance: HrAttendance[];
  leaves: HrLeave[];
  payroll: HrPayroll[];
  performanceReviews: HrPerformanceReview[];
  auditLogs: HrAuditLog[];
}

export function HrDashboardSection({
  employees,
  attendance,
  leaves,
  payroll,
  performanceReviews,
  auditLogs,
}: HrDashboardSectionProps) {
  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = attendance.filter((a) => a.attendanceDate === today);

  const deptCounts = new Map<string, number>();
  for (const e of employees) {
    deptCounts.set(e.department, (deptCounts.get(e.department) ?? 0) + 1);
  }

  const totalPayrollNet = payroll.reduce((s, p) => s + p.netPay, 0);
  const paidPayrollNet = payroll
    .filter((p) => p.status === "Paid")
    .reduce((s, p) => s + p.netPay, 0);
  const avgRating =
    performanceReviews.length > 0
      ? (
          performanceReviews.reduce((s, r) => s + r.rating, 0) /
          performanceReviews.length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-5">
      {/* Department Distribution & Today's Attendance */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-6">
          <h2 className="text-base font-semibold text-[#14191B]">
            Department-wise Staffing Distribution
          </h2>
          <div className="mt-3 space-y-2">
            {Array.from(deptCounts.entries()).map(([dept, count]) => (
              <div
                key={dept}
                className="flex items-center justify-between rounded-[16px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5 text-xs"
              >
                <span className="font-semibold text-[#14191B]">{dept}</span>
                <span className="rounded-full bg-[#181C1E] px-3 py-0.5 font-semibold text-white">
                  {count} staff
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-6">
          <h2 className="text-base font-semibold text-[#14191B]">
            Today&apos;s Attendance & HR Summary ({today})
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-[18px] bg-[#F8FAFA] p-3.5">
              <p className="text-[#6B7A80]">Present / Late Today</p>
              <p className="mt-1 text-xl font-bold text-[#14191B]">
                {todayAtt.filter((a) => a.status === "Present").length} /{" "}
                {todayAtt.filter((a) => a.status === "Late").length}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#F8FAFA] p-3.5">
              <p className="text-[#6B7A80]">Pending Leave Requests</p>
              <p className="mt-1 text-xl font-bold text-[#14191B]">
                {leaves.filter((l) => l.status === "Pending").length}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#F8FAFA] p-3.5">
              <p className="text-[#6B7A80]">Monthly Payroll (Paid / Total)</p>
              <p className="mt-1 text-base font-bold text-[#1F6355]">
                {formatMoney(paidPayrollNet)} / {formatMoney(totalPayrollNet)}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#F8FAFA] p-3.5">
              <p className="text-[#6B7A80]">Avg Appraisal Rating</p>
              <p className="mt-1 text-xl font-bold text-[#4A90A4]">
                {avgRating} / 5.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
        <h3 className="text-base font-semibold text-[#14191B]">
          HR & Payroll Audit Log ({auditLogs.length})
        </h3>
        <div className="mt-3 space-y-2">
          {auditLogs.slice(0, 10).map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getHrBadgeClass(log.action)}`}
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
