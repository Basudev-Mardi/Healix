import type { PoolClient } from "pg";
import { getPool } from "../db/client.js";
import { HttpError } from "../opd/service.js";
import type { HrRole } from "./permissions.js";

export interface LeaveBalances {
  annual: number;
  sick: number;
  casual: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pad(n: number, size = 4): string {
  return String(n).padStart(size, "0");
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

async function nextCounter(key: string, client?: PoolClient): Promise<number> {
  const runner = client ?? getPool();
  const res = await runner.query(
    `INSERT INTO entity_counters (counter_key, current_value)
     VALUES ($1, 1)
     ON CONFLICT (counter_key)
     DO UPDATE SET current_value = entity_counters.current_value + 1
     RETURNING current_value`,
    [key]
  );
  return Number(res.rows[0].current_value);
}

async function writeAudit(
  entry: {
    entityType: string;
    entityId: string;
    action: string;
    actorRole: string;
    actorName: string;
    details: string;
  },
  client?: PoolClient
) {
  const runner = client ?? getPool();
  const seq = await nextCounter("hr_audit", client);
  await runner.query(
    `INSERT INTO hr_audit_logs (
      id, entity_type, entity_id, action, actor_role, actor_name, details
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      `HAUD-${new Date().getFullYear()}-${pad(seq)}`,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.actorRole,
      entry.actorName,
      entry.details,
    ]
  );
}

function mapEmployee(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    fullName: r.full_name as string,
    email: r.email as string,
    phone: r.phone as string,
    address: (r.address as string) ?? "",
    photoUrl: (r.photo_url as string) ?? "",
    qualifications: (r.qualifications as string) ?? "",
    experienceYears: Number(r.experience_years),
    jobTitle: r.job_title as string,
    department: r.department as string,
    positionLevel: r.position_level as string,
    reportingManager: (r.reporting_manager as string) ?? "",
    workLocation: (r.work_location as string) ?? "",
    employmentType: r.employment_type as string,
    joiningDate: r.joining_date as string,
    documents: (r.documents as string[]) ?? [],
    basicSalary: Number(r.basic_salary),
    allowances: Number(r.allowances),
    taxRatePercent: Number(r.tax_rate_percent),
    overtimeHourlyRate: Number(r.overtime_hourly_rate),
    leaveBalances: (r.leave_balances as LeaveBalances) ?? {
      annual: 18,
      sick: 10,
      casual: 6,
    },
    employmentStatus: r.employment_status as
      | "Active"
      | "On Leave"
      | "Suspended"
      | "Terminated",
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapAssignment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    employeeId: r.employee_id as string,
    employeeName: r.employee_name as string,
    fromDepartment: (r.from_department as string) ?? "",
    toDepartment: r.to_department as string,
    newJobTitle: r.new_job_title as string,
    reportingManager: (r.reporting_manager as string) ?? "",
    workLocation: (r.work_location as string) ?? "",
    changeType: r.change_type as string,
    effectiveDate: r.effective_date as string,
    reason: (r.reason as string) ?? "",
    approvedBy: r.approved_by as string,
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapAttendance(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    employeeId: r.employee_id as string,
    employeeName: r.employee_name as string,
    department: r.department as string,
    attendanceDate: r.attendance_date as string,
    checkInTime: (r.check_in_time as string) ?? "",
    checkOutTime: (r.check_out_time as string) ?? "",
    workingHours: Number(r.working_hours),
    overtimeHours: Number(r.overtime_hours),
    isLate: Boolean(r.is_late),
    isEarlyDeparture: Boolean(r.is_early_departure),
    status: r.status as "Present" | "Late" | "Absent" | "On Leave" | "Half Day",
    correctionNote: (r.correction_note as string) ?? "",
    recordedBy: r.recorded_by as string,
  };
}

function mapShift(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    shiftName: r.shift_name as string,
    employeeId: r.employee_id as string,
    employeeName: r.employee_name as string,
    department: r.department as string,
    shiftDate: r.shift_date as string,
    startTime: r.start_time as string,
    endTime: r.end_time as string,
    isRotating: Boolean(r.is_rotating),
    status: r.status as "Scheduled" | "Completed" | "Swapped" | "Cancelled",
    notes: (r.notes as string) ?? "",
  };
}

function mapLeave(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    employeeId: r.employee_id as string,
    employeeName: r.employee_name as string,
    department: r.department as string,
    leaveType: r.leave_type as "Annual" | "Sick" | "Casual" | "Unpaid",
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    daysCount: Number(r.days_count),
    reason: r.reason as string,
    documentRef: (r.document_ref as string) ?? "",
    status: r.status as "Pending" | "Approved" | "Rejected",
    reviewedBy: (r.reviewed_by as string | null) ?? undefined,
    reviewNote: (r.review_note as string) ?? "",
    appliedAt: (r.applied_at as Date).toISOString(),
  };
}

function mapPayroll(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    employeeId: r.employee_id as string,
    employeeName: r.employee_name as string,
    department: r.department as string,
    jobTitle: r.job_title as string,
    payrollMonth: r.payroll_month as string,
    basicPay: Number(r.basic_pay),
    allowances: Number(r.allowances),
    overtimeHours: Number(r.overtime_hours),
    overtimePay: Number(r.overtime_pay),
    bonus: Number(r.bonus),
    grossPay: Number(r.gross_pay),
    unpaidLeaveDeduction: Number(r.unpaid_leave_deduction),
    taxDeduction: Number(r.tax_deduction),
    otherDeductions: Number(r.other_deductions),
    netPay: Number(r.net_pay),
    status: r.status as "Draft" | "Approved" | "Processed" | "Paid",
    approvedBy: (r.approved_by as string | null) ?? undefined,
    paidAt: r.paid_at ? (r.paid_at as Date).toISOString() : undefined,
    createdAt: (r.created_at as Date).toISOString(),
  };
}

function mapPerformance(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    employeeId: r.employee_id as string,
    employeeName: r.employee_name as string,
    department: r.department as string,
    reviewPeriod: r.review_period as string,
    rating: Number(r.rating),
    targets: (r.targets as string) ?? "",
    achievements: (r.achievements as string) ?? "",
    feedback: (r.feedback as string) ?? "",
    disciplinaryNotes: (r.disciplinary_notes as string) ?? "",
    appraisalDecision: r.appraisal_decision as string,
    reviewerName: r.reviewer_name as string,
    status: r.status as "Draft" | "Completed" | "Acknowledged",
    reviewedAt: (r.reviewed_at as Date).toISOString(),
  };
}

function mapAudit(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    entityType: r.entity_type as string,
    entityId: r.entity_id as string,
    action: r.action as string,
    actorRole: r.actor_role as string,
    actorName: r.actor_name as string,
    details: (r.details as string) ?? "",
    createdAt: (r.created_at as Date).toISOString(),
  };
}

export async function getHrState() {
  const pool = getPool();
  const [empRes, asnRes, attRes, shfRes, levRes, payRes, prfRes, audRes] =
    await Promise.all([
      pool.query("SELECT * FROM hr_employees ORDER BY id ASC"),
      pool.query(
        "SELECT * FROM hr_department_assignments ORDER BY created_at DESC"
      ),
      pool.query(
        "SELECT * FROM hr_attendance ORDER BY attendance_date DESC, created_at DESC"
      ),
      pool.query("SELECT * FROM hr_shifts ORDER BY shift_date DESC, start_time ASC"),
      pool.query("SELECT * FROM hr_leaves ORDER BY applied_at DESC"),
      pool.query("SELECT * FROM hr_payroll ORDER BY payroll_month DESC, created_at DESC"),
      pool.query("SELECT * FROM hr_performance_reviews ORDER BY reviewed_at DESC"),
      pool.query("SELECT * FROM hr_audit_logs ORDER BY created_at DESC LIMIT 80"),
    ]);

  return {
    employees: empRes.rows.map(mapEmployee),
    assignments: asnRes.rows.map(mapAssignment),
    attendance: attRes.rows.map(mapAttendance),
    shifts: shfRes.rows.map(mapShift),
    leaves: levRes.rows.map(mapLeave),
    payroll: payRes.rows.map(mapPayroll),
    performanceReviews: prfRes.rows.map(mapPerformance),
    auditLogs: audRes.rows.map(mapAudit),
  };
}

// 1. Employee Registration
export async function registerEmployee(input: {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  qualifications?: string;
  experienceYears?: number;
  jobTitle: string;
  department: string;
  positionLevel?: string;
  reportingManager?: string;
  workLocation?: string;
  employmentType?: string;
  joiningDate: string;
  basicSalary: number;
  allowances?: number;
  taxRatePercent?: number;
  overtimeHourlyRate?: number;
  actorRole: HrRole;
  actorName: string;
}) {
  if (
    !input.fullName?.trim() ||
    !input.email?.trim() ||
    !input.phone?.trim() ||
    !input.jobTitle?.trim() ||
    !input.department?.trim() ||
    !input.joiningDate?.trim()
  ) {
    throw new HttpError(
      "Full name, email, phone, job title, department, and joining date are required."
    );
  }

  const pool = getPool();
  const dup = await pool.query(
    "SELECT id FROM hr_employees WHERE LOWER(email) = LOWER($1)",
    [input.email.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(`Employee with email ${input.email.trim()} already exists.`, 409);
  }

  const seq = await nextCounter("hr_employee");
  const id = `EMP-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO hr_employees (
      id, full_name, email, phone, address, qualifications, experience_years,
      job_title, department, position_level, reporting_manager, work_location,
      employment_type, joining_date, basic_salary, allowances, tax_rate_percent, overtime_hourly_rate
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [
      id,
      input.fullName.trim(),
      input.email.trim().toLowerCase(),
      input.phone.trim(),
      input.address?.trim() ?? "",
      input.qualifications?.trim() ?? "",
      Math.max(0, Number(input.experienceYears ?? 0)),
      input.jobTitle.trim(),
      input.department.trim(),
      input.positionLevel?.trim() || "Staff",
      input.reportingManager?.trim() ?? "",
      input.workLocation?.trim() || "Main Campus",
      input.employmentType?.trim() || "Full-Time",
      input.joiningDate.trim(),
      Math.max(0, Number(input.basicSalary || 3000)),
      Math.max(0, Number(input.allowances ?? 500)),
      Math.min(45, Math.max(0, Number(input.taxRatePercent ?? 10))),
      Math.max(0, Number(input.overtimeHourlyRate ?? 25)),
    ]
  );

  await writeAudit({
    entityType: "Employee",
    entityId: id,
    action: "Registered",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Registered ${input.fullName.trim()} as ${input.jobTitle.trim()} in ${input.department.trim()}`,
  });

  return mapEmployee(res.rows[0]);
}

// 2. Daily Attendance (Prevents duplicates, auto-calculates hours, overtime, late arrival)
export async function recordAttendance(input: {
  employeeId: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: "Present" | "Late" | "Absent" | "On Leave" | "Half Day";
  correctionNote?: string;
  actorRole: HrRole;
  actorName: string;
}) {
  if (!input.employeeId || !input.attendanceDate?.trim()) {
    throw new HttpError("Employee and attendance date are required.");
  }

  const pool = getPool();
  const empRes = await pool.query("SELECT * FROM hr_employees WHERE id = $1", [
    input.employeeId,
  ]);
  if (empRes.rowCount === 0) {
    throw new HttpError(`Employee ${input.employeeId} not found.`, 404);
  }
  const emp = mapEmployee(empRes.rows[0]);

  const dup = await pool.query(
    `SELECT id FROM hr_attendance WHERE employee_id = $1 AND attendance_date = $2`,
    [emp.id, input.attendanceDate.trim()]
  );
  if ((dup.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Duplicate attendance prevented: ${emp.fullName} already has an attendance entry for ${input.attendanceDate}.`,
      409
    );
  }

  let workingHours = 0;
  let overtimeHours = 0;
  let isLate = false;
  let isEarlyDeparture = false;
  let finalStatus = input.status ?? "Present";

  if (
    finalStatus !== "Absent" &&
    finalStatus !== "On Leave" &&
    input.checkInTime &&
    input.checkOutTime
  ) {
    const inMin = parseMinutes(input.checkInTime);
    const outMin = parseMinutes(input.checkOutTime);
    const diffMin = outMin >= inMin ? outMin - inMin : 24 * 60 - inMin + outMin;
    workingHours = round2(diffMin / 60);
    overtimeHours = round2(Math.max(0, workingHours - 8));
    isLate = inMin > 9 * 60 + 15; // Late after 09:15 standard grace
    isEarlyDeparture = workingHours < 7.5 && finalStatus !== "Half Day";
    if (isLate && finalStatus === "Present") finalStatus = "Late";
  }

  const seq = await nextCounter("hr_attendance");
  const id = `ATT-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO hr_attendance (
      id, employee_id, employee_name, department, attendance_date, check_in_time, check_out_time,
      working_hours, overtime_hours, is_late, is_early_departure, status, correction_note, recorded_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [
      id,
      emp.id,
      emp.fullName,
      emp.department,
      input.attendanceDate.trim(),
      input.checkInTime?.trim() ?? "",
      input.checkOutTime?.trim() ?? "",
      workingHours,
      overtimeHours,
      isLate,
      isEarlyDeparture,
      finalStatus,
      input.correctionNote?.trim() ?? "",
      input.actorName,
    ]
  );

  return mapAttendance(res.rows[0]);
}

// 3. Shift Scheduling (Prevents overlapping shifts on same date)
export async function createShift(input: {
  shiftName: string;
  employeeId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  isRotating?: boolean;
  notes?: string;
  actorRole: HrRole;
  actorName: string;
}) {
  if (
    !input.shiftName?.trim() ||
    !input.employeeId ||
    !input.shiftDate?.trim() ||
    !input.startTime?.trim() ||
    !input.endTime?.trim()
  ) {
    throw new HttpError(
      "Shift name, employee, date, start time, and end time are required."
    );
  }

  const pool = getPool();
  const empRes = await pool.query("SELECT * FROM hr_employees WHERE id = $1", [
    input.employeeId,
  ]);
  if (empRes.rowCount === 0) {
    throw new HttpError(`Employee ${input.employeeId} not found.`, 404);
  }
  const emp = mapEmployee(empRes.rows[0]);

  // Check overlapping shift on same date
  const existing = await pool.query(
    `SELECT id, shift_name, start_time, end_time FROM hr_shifts
     WHERE employee_id = $1 AND shift_date = $2 AND status <> 'Cancelled'`,
    [emp.id, input.shiftDate.trim()]
  );
  const newStart = parseMinutes(input.startTime);
  const newEnd = parseMinutes(input.endTime);
  for (const row of existing.rows) {
    const s = parseMinutes(row.start_time as string);
    const e = parseMinutes(row.end_time as string);
    if (newStart < e && newEnd > s) {
      throw new HttpError(
        `Shift conflict: ${emp.fullName} already has "${row.shift_name}" (${row.start_time}-${row.end_time}) on ${input.shiftDate}.`,
        409
      );
    }
  }

  const seq = await nextCounter("hr_shift");
  const id = `SHF-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO hr_shifts (
      id, shift_name, employee_id, employee_name, department, shift_date,
      start_time, end_time, is_rotating, status, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Scheduled',$10) RETURNING *`,
    [
      id,
      input.shiftName.trim(),
      emp.id,
      emp.fullName,
      emp.department,
      input.shiftDate.trim(),
      input.startTime.trim(),
      input.endTime.trim(),
      Boolean(input.isRotating),
      input.notes?.trim() ?? "",
    ]
  );

  return mapShift(res.rows[0]);
}

// 4. Leave Management (Balance validation + Atomic balance deduction on approval)
export async function applyLeave(input: {
  employeeId: string;
  leaveType: "Annual" | "Sick" | "Casual" | "Unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  documentRef?: string;
}) {
  if (
    !input.employeeId ||
    !input.startDate?.trim() ||
    !input.endDate?.trim() ||
    !input.reason?.trim()
  ) {
    throw new HttpError("Employee, start date, end date, and reason are required.");
  }

  const start = new Date(`${input.startDate}T00:00:00Z`);
  const end = new Date(`${input.endDate}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days <= 0) {
    throw new HttpError("End date must be on or after start date.");
  }

  const pool = getPool();
  const empRes = await pool.query("SELECT * FROM hr_employees WHERE id = $1", [
    input.employeeId,
  ]);
  if (empRes.rowCount === 0) {
    throw new HttpError(`Employee ${input.employeeId} not found.`, 404);
  }
  const emp = mapEmployee(empRes.rows[0]);

  if (input.leaveType !== "Unpaid") {
    const key = input.leaveType.toLowerCase() as keyof LeaveBalances;
    const avail = emp.leaveBalances[key] ?? 0;
    if (days > avail) {
      throw new HttpError(
        `Insufficient ${input.leaveType} leave balance: requested ${days} day(s), available ${avail} day(s).`,
        409
      );
    }
  }

  const seq = await nextCounter("hr_leave");
  const id = `LEV-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO hr_leaves (
      id, employee_id, employee_name, department, leave_type, start_date, end_date,
      days_count, reason, document_ref, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Pending') RETURNING *`,
    [
      id,
      emp.id,
      emp.fullName,
      emp.department,
      input.leaveType,
      input.startDate.trim(),
      input.endDate.trim(),
      days,
      input.reason.trim(),
      input.documentRef?.trim() ?? "",
    ]
  );

  return mapLeave(res.rows[0]);
}

export async function reviewLeave(input: {
  leaveId: string;
  status: "Approved" | "Rejected";
  reviewNote?: string;
  actorRole: HrRole;
  actorName: string;
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const levRes = await client.query(
      "SELECT * FROM hr_leaves WHERE id = $1 FOR UPDATE",
      [input.leaveId]
    );
    if (levRes.rowCount === 0) {
      throw new HttpError(`Leave application ${input.leaveId} not found.`, 404);
    }
    const lev = mapLeave(levRes.rows[0]);
    if (lev.status !== "Pending") {
      throw new HttpError(`Leave ${lev.id} is already ${lev.status}.`, 409);
    }

    if (input.status === "Approved" && lev.leaveType !== "Unpaid") {
      const empRes = await client.query(
        "SELECT * FROM hr_employees WHERE id = $1 FOR UPDATE",
        [lev.employeeId]
      );
      const emp = mapEmployee(empRes.rows[0]);
      const key = lev.leaveType.toLowerCase() as keyof LeaveBalances;
      const avail = emp.leaveBalances[key] ?? 0;
      if (lev.daysCount > avail) {
        throw new HttpError(
          `Cannot approve: remaining ${lev.leaveType} balance (${avail}d) is less than ${lev.daysCount}d.`,
          409
        );
      }
      const nextBalances = {
        ...emp.leaveBalances,
        [key]: avail - lev.daysCount,
      };
      await client.query(
        `UPDATE hr_employees SET leave_balances = $2::jsonb, updated_at = NOW() WHERE id = $1`,
        [emp.id, JSON.stringify(nextBalances)]
      );
    }

    const upd = await client.query(
      `UPDATE hr_leaves
       SET status = $2, reviewed_by = $3, review_note = $4, reviewed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [lev.id, input.status, input.actorName, input.reviewNote?.trim() ?? ""]
    );

    await writeAudit(
      {
        entityType: "Leave",
        entityId: lev.id,
        action: input.status,
        actorRole: input.actorRole,
        actorName: input.actorName,
        details: `${input.status} ${lev.daysCount}d ${lev.leaveType} leave for ${lev.employeeName}`,
      },
      client
    );

    await client.query("COMMIT");
    return mapLeave(upd.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// 5. Payroll (Integrates Attendance Overtime + Approved Unpaid Leave + Tax; Prevents duplicates)
export async function generatePayroll(input: {
  employeeId: string;
  payrollMonth: string; // YYYY-MM
  bonus?: number;
  otherDeductions?: number;
  actorRole: HrRole;
  actorName: string;
}) {
  if (!input.employeeId || !/^\d{4}-\d{2}$/.test(input.payrollMonth || "")) {
    throw new HttpError("Employee and valid payroll month (YYYY-MM) are required.");
  }

  const pool = getPool();
  const [empRes, dupRes, attRes, levRes] = await Promise.all([
    pool.query("SELECT * FROM hr_employees WHERE id = $1", [input.employeeId]),
    pool.query(
      "SELECT id FROM hr_payroll WHERE employee_id = $1 AND payroll_month = $2",
      [input.employeeId, input.payrollMonth]
    ),
    pool.query(
      `SELECT COALESCE(SUM(overtime_hours), 0)::numeric AS ot
       FROM hr_attendance
       WHERE employee_id = $1 AND attendance_date LIKE $2`,
      [input.employeeId, `${input.payrollMonth}%`]
    ),
    pool.query(
      `SELECT COALESCE(SUM(days_count), 0)::int AS unpaid_days
       FROM hr_leaves
       WHERE employee_id = $1
         AND leave_type = 'Unpaid'
         AND status = 'Approved'
         AND start_date LIKE $2`,
      [input.employeeId, `${input.payrollMonth}%`]
    ),
  ]);

  if (empRes.rowCount === 0) {
    throw new HttpError(`Employee ${input.employeeId} not found.`, 404);
  }
  if ((dupRes.rowCount ?? 0) > 0) {
    throw new HttpError(
      `Duplicate payroll prevented: payroll ${dupRes.rows[0].id} already exists for ${input.payrollMonth}.`,
      409
    );
  }

  const emp = mapEmployee(empRes.rows[0]);
  const overtimeHours = round2(Number(attRes.rows[0]?.ot ?? 0));
  const overtimePay = round2(overtimeHours * emp.overtimeHourlyRate);
  const bonus = round2(Math.max(0, Number(input.bonus ?? 0)));
  const grossPay = round2(emp.basicSalary + emp.allowances + overtimePay + bonus);

  const unpaidDays = Number(levRes.rows[0]?.unpaid_days ?? 0);
  const unpaidLeaveDeduction = round2((emp.basicSalary / 30) * unpaidDays);
  const taxDeduction = round2((grossPay * emp.taxRatePercent) / 100);
  const otherDeductions = round2(Math.max(0, Number(input.otherDeductions ?? 0)));
  const netPay = Math.max(
    0,
    round2(grossPay - unpaidLeaveDeduction - taxDeduction - otherDeductions)
  );

  const seq = await nextCounter("hr_payroll");
  const id = `PAYR-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO hr_payroll (
      id, employee_id, employee_name, department, job_title, payroll_month,
      basic_pay, allowances, overtime_hours, overtime_pay, bonus, gross_pay,
      unpaid_leave_deduction, tax_deduction, other_deductions, net_pay, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'Draft')
    RETURNING *`,
    [
      id,
      emp.id,
      emp.fullName,
      emp.department,
      emp.jobTitle,
      input.payrollMonth,
      emp.basicSalary,
      emp.allowances,
      overtimeHours,
      overtimePay,
      bonus,
      grossPay,
      unpaidLeaveDeduction,
      taxDeduction,
      otherDeductions,
      netPay,
    ]
  );

  await writeAudit({
    entityType: "Payroll",
    entityId: id,
    action: "Generated",
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Generated ${input.payrollMonth} payroll for ${emp.fullName} (Net $${netPay.toFixed(2)})`,
  });

  return mapPayroll(res.rows[0]);
}

export async function updatePayrollStatus(input: {
  payrollId: string;
  status: "Approved" | "Processed" | "Paid";
  actorRole: HrRole;
  actorName: string;
}) {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE hr_payroll
     SET status = $2,
         approved_by = CASE WHEN $2 IN ('Approved','Paid') THEN COALESCE(approved_by, $3) ELSE approved_by END,
         paid_at = CASE WHEN $2 = 'Paid' THEN NOW() ELSE paid_at END,
         updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [input.payrollId, input.status, input.actorName]
  );
  if (res.rowCount === 0) {
    throw new HttpError(`Payroll ${input.payrollId} not found.`, 404);
  }
  await writeAudit({
    entityType: "Payroll",
    entityId: input.payrollId,
    action: input.status,
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `Payroll ${input.payrollId} marked ${input.status}`,
  });
  return mapPayroll(res.rows[0]);
}

// 6. Department Assignment / Transfer / Promotion / Termination
export async function assignDepartment(input: {
  employeeId: string;
  toDepartment: string;
  newJobTitle: string;
  reportingManager?: string;
  workLocation?: string;
  changeType: "Transfer" | "Promotion" | "Role Change" | "Termination";
  effectiveDate: string;
  reason?: string;
  newBasicSalary?: number;
  actorRole: HrRole;
  actorName: string;
}) {
  const pool = getPool();
  const empRes = await pool.query("SELECT * FROM hr_employees WHERE id = $1", [
    input.employeeId,
  ]);
  if (empRes.rowCount === 0) {
    throw new HttpError(`Employee ${input.employeeId} not found.`, 404);
  }
  const emp = mapEmployee(empRes.rows[0]);

  const seq = await nextCounter("hr_assignment");
  const id = `ASN-HR-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO hr_department_assignments (
      id, employee_id, employee_name, from_department, to_department, new_job_title,
      reporting_manager, work_location, change_type, effective_date, reason, approved_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      id,
      emp.id,
      emp.fullName,
      emp.department,
      input.toDepartment.trim() || emp.department,
      input.newJobTitle.trim() || emp.jobTitle,
      input.reportingManager?.trim() || emp.reportingManager,
      input.workLocation?.trim() || emp.workLocation,
      input.changeType,
      input.effectiveDate.trim(),
      input.reason?.trim() ?? "",
      input.actorName,
    ]
  );

  await pool.query(
    `UPDATE hr_employees
     SET department = $2,
         job_title = $3,
         reporting_manager = $4,
         work_location = $5,
         basic_salary = COALESCE($6, basic_salary),
         employment_status = CASE WHEN $7 = 'Termination' THEN 'Terminated' ELSE employment_status END,
         updated_at = NOW()
     WHERE id = $1`,
    [
      emp.id,
      input.toDepartment.trim() || emp.department,
      input.newJobTitle.trim() || emp.jobTitle,
      input.reportingManager?.trim() || emp.reportingManager,
      input.workLocation?.trim() || emp.workLocation,
      input.newBasicSalary !== undefined && Number(input.newBasicSalary) > 0
        ? Number(input.newBasicSalary)
        : null,
      input.changeType,
    ]
  );

  await writeAudit({
    entityType: "Assignment",
    entityId: id,
    action: input.changeType,
    actorRole: input.actorRole,
    actorName: input.actorName,
    details: `${input.changeType} for ${emp.fullName}: ${emp.department} -> ${input.toDepartment}`,
  });

  return mapAssignment(res.rows[0]);
}

// 7. Performance Records
export async function createPerformanceReview(input: {
  employeeId: string;
  reviewPeriod: string;
  rating: number;
  targets?: string;
  achievements?: string;
  feedback?: string;
  disciplinaryNotes?: string;
  appraisalDecision: string;
  reviewerName: string;
  actorRole: HrRole;
}) {
  if (!input.employeeId || !input.reviewPeriod?.trim()) {
    throw new HttpError("Employee and review period are required.");
  }

  const pool = getPool();
  const empRes = await pool.query("SELECT * FROM hr_employees WHERE id = $1", [
    input.employeeId,
  ]);
  if (empRes.rowCount === 0) {
    throw new HttpError(`Employee ${input.employeeId} not found.`, 404);
  }
  const emp = mapEmployee(empRes.rows[0]);
  const rating = Math.min(5, Math.max(1, Number(input.rating || 4)));

  const seq = await nextCounter("hr_performance");
  const id = `PRF-${new Date().getFullYear()}-${pad(seq)}`;

  const res = await pool.query(
    `INSERT INTO hr_performance_reviews (
      id, employee_id, employee_name, department, review_period, rating, targets,
      achievements, feedback, disciplinary_notes, appraisal_decision, reviewer_name, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Completed') RETURNING *`,
    [
      id,
      emp.id,
      emp.fullName,
      emp.department,
      input.reviewPeriod.trim(),
      rating,
      input.targets?.trim() ?? "",
      input.achievements?.trim() ?? "",
      input.feedback?.trim() ?? "",
      input.disciplinaryNotes?.trim() ?? "",
      input.appraisalDecision?.trim() || "Met Expectations",
      input.reviewerName?.trim() || input.actorRole,
    ]
  );

  await writeAudit({
    entityType: "Performance",
    entityId: id,
    action: "Evaluated",
    actorRole: input.actorRole,
    actorName: input.reviewerName?.trim() || input.actorRole,
    details: `Recorded ${input.reviewPeriod} evaluation (${rating}/5 — ${input.appraisalDecision}) for ${emp.fullName}`,
  });

  return mapPerformance(res.rows[0]);
}
