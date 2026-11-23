"use client";

import React, { useState } from "react";
import type { HrEmployee, HrPayroll } from "@/lib/hr/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  SECONDARY_BTN_CLASS,
  formatMoney,
  getHrBadgeClass,
  printPayslipPdf,
} from "./ui";

interface PayrollSectionProps {
  employees: HrEmployee[];
  payroll: HrPayroll[];
  canManagePayroll: boolean;
  onGeneratePayroll: (payload: {
    employeeId: string;
    payrollMonth: string;
    bonus: number;
    otherDeductions: number;
  }) => Promise<boolean>;
  onUpdatePayrollStatus: (payload: {
    payrollId: string;
    status: "Approved" | "Processed" | "Paid";
  }) => Promise<void>;
}

export function PayrollSection({
  employees,
  payroll,
  canManagePayroll,
  onGeneratePayroll,
  onUpdatePayrollStatus,
}: PayrollSectionProps) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [payrollMonth, setPayrollMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [bonus, setBonus] = useState("0");
  const [otherDeductions, setOtherDeductions] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const empId = employeeId || employees[0]?.id || "";
    if (!empId) return;
    setSubmitting(true);
    try {
      await onGeneratePayroll({
        employeeId: empId,
        payrollMonth,
        bonus: Number(bonus) || 0,
        otherDeductions: Number(otherDeductions) || 0,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <form
        onSubmit={handleGenerate}
        className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-5"
      >
        <h2 className="text-lg font-semibold text-[#14191B]">
          Generate Monthly Payroll
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7A80]">
          Automatically integrates basic salary, allowances, monthly attendance
          overtime hours, approved unpaid leaves, and tax deductions. Prevents
          duplicate payroll runs.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={LABEL_CLASS}>Employee *</label>
            <select
              value={employeeId || employees[0]?.id || ""}
              onChange={(e) => setEmployeeId(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canManagePayroll}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.department}) — Basic {formatMoney(e.basicSalary)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Payroll Month (YYYY-MM) *</label>
            <input
              type="month"
              required
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className={INPUT_CLASS}
              disabled={!canManagePayroll}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Bonus / Incentive ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canManagePayroll}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Other Deductions ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(e.target.value)}
                className={INPUT_CLASS}
                disabled={!canManagePayroll}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canManagePayroll || submitting}
            className={`${PRIMARY_BTN_CLASS} w-full`}
          >
            {submitting ? "Calculating Payroll..." : "Generate Monthly Payslip"}
          </button>
        </div>
      </form>

      <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5 lg:col-span-7">
        <h3 className="text-base font-semibold text-[#14191B]">
          Monthly Payroll & Payslips ({payroll.length})
        </h3>
        <div className="mt-4 space-y-3">
          {payroll.map((p) => (
            <div
              key={p.id}
              className="rounded-[22px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {p.id} • {p.payrollMonth}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getHrBadgeClass(p.status)}`}
                  >
                    {p.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => printPayslipPdf(p)}
                  className={SECONDARY_BTN_CLASS}
                >
                  Print / PDF Payslip
                </button>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#14191B]">
                {p.employeeName} — {p.jobTitle} ({p.department})
              </p>

              <div className="mt-2 grid grid-cols-4 gap-2 rounded-[14px] bg-white p-2.5">
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Gross</p>
                  <p className="font-bold text-[#14191B]">
                    {formatMoney(p.grossPay)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7D8C92]">
                    OT ({p.overtimeHours}h)
                  </p>
                  <p className="font-bold text-[#4A90A4]">
                    {formatMoney(p.overtimePay)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Tax & Ded.</p>
                  <p className="font-bold text-[#B8381B]">
                    -
                    {formatMoney(
                      p.taxDeduction + p.unpaidLeaveDeduction + p.otherDeductions
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7D8C92]">Net Pay</p>
                  <p className="font-bold text-[#1F6355]">
                    {formatMoney(p.netPay)}
                  </p>
                </div>
              </div>

              {canManagePayroll && p.status !== "Paid" && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E6EDEF] pt-3">
                  {p.status === "Draft" && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePayrollStatus({
                          payrollId: p.id,
                          status: "Approved",
                        })
                      }
                      className={ACCENT_BTN_CLASS}
                    >
                      Approve Payroll
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePayrollStatus({ payrollId: p.id, status: "Paid" })
                    }
                    className={PRIMARY_BTN_CLASS}
                  >
                    Mark Salary Paid
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
