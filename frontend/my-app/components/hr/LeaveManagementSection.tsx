"use client";

import React, { useState } from "react";
import type { HrEmployee, HrLeave } from "@/lib/hr/types";
import {
  ACCENT_BTN_CLASS,
  DANGER_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getHrBadgeClass,
} from "./ui";

interface LeaveManagementSectionProps {
  employees: HrEmployee[];
  leaves: HrLeave[];
  canApply: boolean;
  canApprove: boolean;
  onApplyLeave: (payload: {
    employeeId: string;
    leaveType: "Annual" | "Sick" | "Casual" | "Unpaid";
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<boolean>;
  onReviewLeave: (payload: {
    leaveId: string;
    status: "Approved" | "Rejected";
    reviewNote: string;
  }) => Promise<void>;
}

export function LeaveManagementSection({
  employees,
  leaves,
  canApply,
  canApprove,
  onApplyLeave,
  onReviewLeave,
}: LeaveManagementSectionProps) {
  const [form, setForm] = useState({
    employeeId: employees[0]?.id ?? "",
    leaveType: "Annual" as "Annual" | "Sick" | "Casual" | "Unpaid",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedEmp = employees.find(
    (e) => e.id === (form.employeeId || employees[0]?.id)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const empId = form.employeeId || employees[0]?.id || "";
    if (!empId) return;
    setSubmitting(true);
    try {
      const ok = await onApplyLeave({ ...form, employeeId: empId });
      if (ok) setForm({ ...form, reason: "" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Submit Leave Application
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Validates available leave balance before submission and deducts
          automatically upon approval.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Employee *</label>
            <select
              value={form.employeeId || employees[0]?.id || ""}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canApply}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.department})
                </option>
              ))}
            </select>
          </div>

          {selectedEmp && (
            <div className="rounded-[16px] bg-white px-3.5 py-2.5 text-xs text-[#47565C]">
              Balances — Annual:{" "}
              <strong>{selectedEmp.leaveBalances.annual}d</strong> • Sick:{" "}
              <strong>{selectedEmp.leaveBalances.sick}d</strong> • Casual:{" "}
              <strong>{selectedEmp.leaveBalances.casual}d</strong>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Leave Type *</label>
            <select
              value={form.leaveType}
              onChange={(e) =>
                setForm({
                  ...form,
                  leaveType: e.target.value as
                    | "Annual"
                    | "Sick"
                    | "Casual"
                    | "Unpaid",
                })
              }
              className={INPUT_CLASS}
              disabled={!canApply}
            >
              <option value="Annual">Annual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
              <option value="Unpaid">Unpaid Leave (LWP)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canApply}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>End Date *</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={INPUT_CLASS}
                disabled={!canApply}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Reason *</label>
            <textarea
              rows={2}
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={INPUT_CLASS}
              disabled={!canApply}
            />
          </div>

          <button
            type="submit"
            disabled={!canApply || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Leave Applications & Approvals ({leaves.length})
        </h3>
        <div className="mt-4 space-y-3">
          {leaves.map((lv) => (
            <div
              key={lv.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {lv.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getHrBadgeClass(lv.status)}`}
                  >
                    {lv.status}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                    {lv.leaveType} ({lv.daysCount}d)
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7A80]">
                  {lv.startDate} → {lv.endDate}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {lv.employeeName} ({lv.department})
              </p>
              <p className="mt-0.5 text-[#546369]">Reason: {lv.reason}</p>

              {canApprove && lv.status === "Pending" && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      onReviewLeave({
                        leaveId: lv.id,
                        status: "Approved",
                        reviewNote: "Approved by HR/Manager",
                      })
                    }
                    className={ACCENT_BTN_CLASS}
                  >
                    Approve & Deduct Balance
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onReviewLeave({
                        leaveId: lv.id,
                        status: "Rejected",
                        reviewNote: "Rejected due to staffing requirements",
                      })
                    }
                    className={DANGER_BTN_CLASS}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
