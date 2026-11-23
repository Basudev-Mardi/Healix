"use client";

import React, { useState } from "react";
import type { HrAssignment, HrEmployee } from "@/lib/hr/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  formatMoney,
  getHrBadgeClass,
} from "./ui";

interface EmployeesSectionProps {
  employees: HrEmployee[];
  assignments: HrAssignment[];
  canManageEmployees: boolean;
  canAssignDepartment: boolean;
  onRegisterEmployee: (payload: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    qualifications: string;
    experienceYears: number;
    jobTitle: string;
    department: string;
    reportingManager: string;
    workLocation: string;
    employmentType: string;
    joiningDate: string;
    basicSalary: number;
    allowances: number;
  }) => Promise<boolean>;
  onAssignDepartment: (payload: {
    employeeId: string;
    toDepartment: string;
    newJobTitle: string;
    reportingManager: string;
    workLocation: string;
    changeType: "Transfer" | "Promotion" | "Role Change" | "Termination";
    effectiveDate: string;
    reason: string;
    newBasicSalary?: number;
  }) => Promise<boolean>;
}

export function EmployeesSection({
  employees,
  assignments,
  canManageEmployees,
  canAssignDepartment,
  onRegisterEmployee,
  onAssignDepartment,
}: EmployeesSectionProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    qualifications: "",
    experienceYears: "3",
    jobTitle: "",
    department: "General Medicine",
    reportingManager: "Hospital Administrator",
    workLocation: "Main Campus",
    employmentType: "Full-Time",
    joiningDate: new Date().toISOString().slice(0, 10),
    basicSalary: "3500",
    allowances: "600",
  });
  const [submitting, setSubmitting] = useState(false);

  const [asnForm, setAsnForm] = useState({
    employeeId: employees[0]?.id ?? "",
    toDepartment: "ICU",
    newJobTitle: "",
    reportingManager: "Chief Medical Officer",
    workLocation: "Main Campus",
    changeType: "Transfer" as
      | "Transfer"
      | "Promotion"
      | "Role Change"
      | "Termination",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: "",
    newBasicSalary: "",
  });
  const [assigning, setAssigning] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await onRegisterEmployee({
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
        basicSalary: Number(form.basicSalary) || 3000,
        allowances: Number(form.allowances) || 0,
      });
      if (ok) {
        setForm({
          ...form,
          fullName: "",
          email: "",
          phone: "",
          jobTitle: "",
          qualifications: "",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    const empId = asnForm.employeeId || employees[0]?.id || "";
    if (!empId) return;
    setAssigning(true);
    try {
      const ok = await onAssignDepartment({
        ...asnForm,
        employeeId: empId,
        newBasicSalary: asnForm.newBasicSalary
          ? Number(asnForm.newBasicSalary)
          : undefined,
      });
      if (ok) {
        setAsnForm({ ...asnForm, newJobTitle: "", reason: "", newBasicSalary: "" });
      }
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <form
          onSubmit={handleRegister}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h2 className="text-lg font-semibold text-[#14191B]">
            Register New Employee
          </h2>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Phone *</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Department *</label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Emergency">Emergency</option>
                  <option value="ICU">ICU</option>
                  <option value="Surgery / OT">Surgery / OT</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Job Title *</label>
                <input
                  type="text"
                  required
                  value={form.jobTitle}
                  onChange={(e) =>
                    setForm({ ...form, jobTitle: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Qualifications</label>
                <input
                  type="text"
                  value={form.qualifications}
                  onChange={(e) =>
                    setForm({ ...form, qualifications: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className={LABEL_CLASS}>Joining Date *</label>
                <input
                  type="date"
                  required
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm({ ...form, joiningDate: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Basic ($) *</label>
                <input
                  type="number"
                  required
                  value={form.basicSalary}
                  onChange={(e) =>
                    setForm({ ...form, basicSalary: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Allowances ($)</label>
                <input
                  type="number"
                  value={form.allowances}
                  onChange={(e) =>
                    setForm({ ...form, allowances: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageEmployees}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!canManageEmployees || submitting}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {submitting ? "Registering..." : "Register Employee"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleAssign}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h3 className="text-base font-semibold text-[#14191B]">
            Department Transfer / Promotion / Status Change
          </h3>
          <div className="mt-3 space-y-3">
            <select
              value={asnForm.employeeId || employees[0]?.id || ""}
              onChange={(e) =>
                setAsnForm({ ...asnForm, employeeId: e.target.value })
              }
              className={INPUT_CLASS}
              disabled={!canAssignDepartment}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.department})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={asnForm.changeType}
                onChange={(e) =>
                  setAsnForm({
                    ...asnForm,
                    changeType: e.target.value as
                      | "Transfer"
                      | "Promotion"
                      | "Role Change"
                      | "Termination",
                  })
                }
                className={INPUT_CLASS}
                disabled={!canAssignDepartment}
              >
                <option value="Transfer">Transfer</option>
                <option value="Promotion">Promotion</option>
                <option value="Role Change">Role Change</option>
                <option value="Termination">Termination</option>
              </select>
              <input
                type="text"
                required
                value={asnForm.toDepartment}
                onChange={(e) =>
                  setAsnForm({ ...asnForm, toDepartment: e.target.value })
                }
                placeholder="Target Department"
                className={INPUT_CLASS}
                disabled={!canAssignDepartment}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={asnForm.newJobTitle}
                onChange={(e) =>
                  setAsnForm({ ...asnForm, newJobTitle: e.target.value })
                }
                placeholder="New Job Title"
                className={INPUT_CLASS}
                disabled={!canAssignDepartment}
              />
              <input
                type="number"
                value={asnForm.newBasicSalary}
                onChange={(e) =>
                  setAsnForm({ ...asnForm, newBasicSalary: e.target.value })
                }
                placeholder="Revised Basic $ (opt)"
                className={INPUT_CLASS}
                disabled={!canAssignDepartment}
              />
            </div>
            <input
              type="text"
              value={asnForm.reason}
              onChange={(e) =>
                setAsnForm({ ...asnForm, reason: e.target.value })
              }
              placeholder="Reason / remarks"
              className={INPUT_CLASS}
              disabled={!canAssignDepartment}
            />
            <button
              type="submit"
              disabled={!canAssignDepartment || assigning}
              className={`${ACCENT_BTN_CLASS} w-full`}
            >
              {assigning ? "Updating Assignment..." : "Save Assignment Change"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Employee Directory ({employees.length})
          </h3>
          <div className="mt-4 space-y-2.5">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="rounded-[20px] border border-white/90 bg-[#F8FAFA] p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#181C1E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {emp.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getHrBadgeClass(emp.employmentStatus)}`}
                    >
                      {emp.employmentStatus}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#47565C]">
                      {emp.department}
                    </span>
                  </div>
                  <span className="font-bold text-[#14191B]">
                    {formatMoney(emp.basicSalary + emp.allowances)} / mo
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#14191B]">
                  {emp.fullName} — {emp.jobTitle}
                </p>
                <p className="mt-0.5 text-[#546369]">
                  {emp.email} • {emp.phone} • Joined {emp.joiningDate} •{" "}
                  {emp.qualifications || "—"}
                </p>
                <p className="mt-1 text-[11px] text-[#4A90A4]">
                  Leave Balances — Annual: {emp.leaveBalances.annual}d • Sick:{" "}
                  {emp.leaveBalances.sick}d • Casual: {emp.leaveBalances.casual}
                  d
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Department Assignment & Promotion History ({assignments.length})
          </h3>
          <div className="mt-3 space-y-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#14191B]">
                    {a.employeeName} ({a.changeType})
                  </span>
                  <span className="text-[11px] text-[#6B7A80]">
                    Eff: {a.effectiveDate}
                  </span>
                </div>
                <p className="mt-0.5 text-[#546369]">
                  {a.fromDepartment} → <strong>{a.toDepartment}</strong> •{" "}
                  {a.newJobTitle} • {a.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
