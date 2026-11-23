export type HrRole =
  | "Super Admin"
  | "Hospital Administrator"
  | "HR Manager"
  | "Department Head"
  | "Payroll Officer"
  | "Employee";

export interface LeaveBalances {
  annual: number;
  sick: number;
  casual: number;
}

export interface HrEmployee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  photoUrl: string;
  qualifications: string;
  experienceYears: number;
  jobTitle: string;
  department: string;
  positionLevel: string;
  reportingManager: string;
  workLocation: string;
  employmentType: string;
  joiningDate: string;
  documents: string[];
  basicSalary: number;
  allowances: number;
  taxRatePercent: number;
  overtimeHourlyRate: number;
  leaveBalances: LeaveBalances;
  employmentStatus: "Active" | "On Leave" | "Suspended" | "Terminated";
  createdAt: string;
}

export interface HrAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  fromDepartment: string;
  toDepartment: string;
  newJobTitle: string;
  reportingManager: string;
  workLocation: string;
  changeType: string;
  effectiveDate: string;
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface HrAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime: string;
  workingHours: number;
  overtimeHours: number;
  isLate: boolean;
  isEarlyDeparture: boolean;
  status: "Present" | "Late" | "Absent" | "On Leave" | "Half Day";
  correctionNote: string;
  recordedBy: string;
}

export interface HrShift {
  id: string;
  shiftName: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  isRotating: boolean;
  status: "Scheduled" | "Completed" | "Swapped" | "Cancelled";
  notes: string;
}

export interface HrLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: "Annual" | "Sick" | "Casual" | "Unpaid";
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  documentRef: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string;
  reviewNote: string;
  appliedAt: string;
}

export interface HrPayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  payrollMonth: string;
  basicPay: number;
  allowances: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  grossPay: number;
  unpaidLeaveDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  netPay: number;
  status: "Draft" | "Approved" | "Processed" | "Paid";
  approvedBy?: string;
  paidAt?: string;
  createdAt: string;
}

export interface HrPerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  reviewPeriod: string;
  rating: number;
  targets: string;
  achievements: string;
  feedback: string;
  disciplinaryNotes: string;
  appraisalDecision: string;
  reviewerName: string;
  status: "Draft" | "Completed" | "Acknowledged";
  reviewedAt: string;
}

export interface HrAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorRole: string;
  actorName: string;
  details: string;
  createdAt: string;
}

export interface HrState {
  employees: HrEmployee[];
  assignments: HrAssignment[];
  attendance: HrAttendance[];
  shifts: HrShift[];
  leaves: HrLeave[];
  payroll: HrPayroll[];
  performanceReviews: HrPerformanceReview[];
  auditLogs: HrAuditLog[];
}
