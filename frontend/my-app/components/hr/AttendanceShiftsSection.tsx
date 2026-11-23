"use client";

import React, { useState } from "react";
import type { HrAttendance, HrEmployee, HrShift } from "@/lib/hr/types";
import {
  ACCENT_BTN_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BTN_CLASS,
  getHrBadgeClass,
} from "./ui";

interface AttendanceShiftsSectionProps {
  employees: HrEmployee[];
  attendance: HrAttendance[];
  shifts: HrShift[];
  canManageAttendance: boolean;
  canManageShifts: boolean;
  onRecordAttendance: (payload: {
    employeeId: string;
    attendanceDate: string;
    checkInTime: string;
    checkOutTime: string;
    status: "Present" | "Late" | "Absent" | "On Leave" | "Half Day";
    correctionNote: string;
  }) => Promise<boolean>;
  onCreateShift: (payload: {
    shiftName: string;
    employeeId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    isRotating: boolean;
    notes: string;
  }) => Promise<boolean>;
}

export function AttendanceShiftsSection({
  employees,
  attendance,
  shifts,
  canManageAttendance,
  canManageShifts,
  onRecordAttendance,
  onCreateShift,
}: AttendanceShiftsSectionProps) {
  const [attForm, setAttForm] = useState({
    employeeId: employees[0]?.id ?? "",
    attendanceDate: new Date().toISOString().slice(0, 10),
    checkInTime: "09:00",
    checkOutTime: "18:00",
    status: "Present" as "Present" | "Late" | "Absent" | "On Leave" | "Half Day",
    correctionNote: "",
  });
  const [savingAtt, setSavingAtt] = useState(false);

  const [shfForm, setShfForm] = useState({
    shiftName: "Morning Shift",
    employeeId: employees[0]?.id ?? "",
    shiftDate: new Date().toISOString().slice(0, 10),
    startTime: "07:00",
    endTime: "15:00",
    isRotating: true,
    notes: "",
  });
  const [savingShf, setSavingShf] = useState(false);

  async function handleAtt(e: React.FormEvent) {
    e.preventDefault();
    const empId = attForm.employeeId || employees[0]?.id || "";
    if (!empId) return;
    setSavingAtt(true);
    try {
      await onRecordAttendance({ ...attForm, employeeId: empId });
    } finally {
      setSavingAtt(false);
    }
  }

  async function handleShift(e: React.FormEvent) {
    e.preventDefault();
    const empId = shfForm.employeeId || employees[0]?.id || "";
    if (!empId) return;
    setSavingShf(true);
    try {
      await onCreateShift({ ...shfForm, employeeId: empId });
    } finally {
      setSavingShf(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <form
          onSubmit={handleAtt}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h2 className="text-lg font-semibold text-[#14191B]">
            Record Daily Attendance
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7A80]">
            Auto-calculates working hours, overtime (&gt;8h), and late arrivals
            (&gt;09:15); prevents duplicate entries per day.
          </p>
          <div className="mt-3 space-y-3">
            <select
              value={attForm.employeeId || employees[0]?.id || ""}
              onChange={(e) =>
                setAttForm({ ...attForm, employeeId: e.target.value })
              }
              className={INPUT_CLASS}
              disabled={!canManageAttendance}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.department})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Date *</label>
                <input
                  type="date"
                  required
                  value={attForm.attendanceDate}
                  onChange={(e) =>
                    setAttForm({ ...attForm, attendanceDate: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageAttendance}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Status</label>
                <select
                  value={attForm.status}
                  onChange={(e) =>
                    setAttForm({
                      ...attForm,
                      status: e.target.value as
                        | "Present"
                        | "Late"
                        | "Absent"
                        | "On Leave"
                        | "Half Day",
                    })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageAttendance}
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Check-in</label>
                <input
                  type="time"
                  value={attForm.checkInTime}
                  onChange={(e) =>
                    setAttForm({ ...attForm, checkInTime: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageAttendance}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Check-out</label>
                <input
                  type="time"
                  value={attForm.checkOutTime}
                  onChange={(e) =>
                    setAttForm({ ...attForm, checkOutTime: e.target.value })
                  }
                  className={INPUT_CLASS}
                  disabled={!canManageAttendance}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!canManageAttendance || savingAtt}
              className={`${PRIMARY_BTN_CLASS} w-full`}
            >
              {savingAtt ? "Recording..." : "Record Attendance"}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleShift}
          className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5"
        >
          <h3 className="text-base font-semibold text-[#14191B]">
            Schedule Staff Shift (Conflict-Protected)
          </h3>
          <div className="mt-3 space-y-3">
            <select
              value={shfForm.employeeId || employees[0]?.id || ""}
              onChange={(e) =>
                setShfForm({ ...shfForm, employeeId: e.target.value })
              }
              className={INPUT_CLASS}
              disabled={!canManageShifts}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.department})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={shfForm.shiftName}
                onChange={(e) =>
                  setShfForm({ ...shfForm, shiftName: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageShifts}
              >
                <option value="Morning Shift">Morning Shift</option>
                <option value="Day Shift">Day Shift</option>
                <option value="Evening Shift">Evening Shift</option>
                <option value="Night Shift">Night Shift</option>
              </select>
              <input
                type="date"
                required
                value={shfForm.shiftDate}
                onChange={(e) =>
                  setShfForm({ ...shfForm, shiftDate: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageShifts}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                required
                value={shfForm.startTime}
                onChange={(e) =>
                  setShfForm({ ...shfForm, startTime: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageShifts}
              />
              <input
                type="time"
                required
                value={shfForm.endTime}
                onChange={(e) =>
                  setShfForm({ ...shfForm, endTime: e.target.value })
                }
                className={INPUT_CLASS}
                disabled={!canManageShifts}
              />
            </div>
            <button
              type="submit"
              disabled={!canManageShifts || savingShf}
              className={`${ACCENT_BTN_CLASS} w-full`}
            >
              {savingShf ? "Assigning Shift..." : "Assign Shift"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Attendance Records ({attendance.length})
          </h3>
          <div className="mt-3 space-y-2">
            {attendance.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3.5 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#14191B]">
                      {a.employeeName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getHrBadgeClass(a.status)}`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#6B7A80]">
                    {a.attendanceDate} • {a.checkInTime || "—"} –{" "}
                    {a.checkOutTime || "—"} • {a.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#14191B]">
                    {a.workingHours} hrs
                  </p>
                  {a.overtimeHours > 0 && (
                    <p className="text-[11px] font-semibold text-[#4A90A4]">
                      +{a.overtimeHours}h OT
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-5">
          <h3 className="text-base font-semibold text-[#14191B]">
            Scheduled Shifts ({shifts.length})
          </h3>
          <div className="mt-3 space-y-2">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-white/90 bg-[#F8FAFA] p-3.5 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#14191B]">
                    {s.employeeName} — {s.shiftName}
                  </p>
                  <p className="text-[11px] text-[#6B7A80]">
                    {s.shiftDate} • {s.startTime} – {s.endTime} • {s.department}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getHrBadgeClass(s.status)}`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
