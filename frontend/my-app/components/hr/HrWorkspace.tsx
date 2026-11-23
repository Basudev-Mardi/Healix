"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { hasHrPermission, HR_ROLES } from "@/lib/hr/permissions";
import type { HrRole, HrState } from "@/lib/hr/types";
import { AttendanceShiftsSection } from "./AttendanceShiftsSection";
import { EmployeesSection } from "./EmployeesSection";
import { HrDashboardSection } from "./HrDashboardSection";
import { LeaveManagementSection } from "./LeaveManagementSection";
import { PayrollSection } from "./PayrollSection";
import { PerformanceSection } from "./PerformanceSection";
import { formatMoney } from "./ui";

type HrTab =
  | "dashboard"
  | "employees"
  | "attendance"
  | "leaves"
  | "payroll"
  | "performance";

const HR_TABS: { id: HrTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard & Reports" },
  { id: "employees", label: "1 & 6. Employees & Dept" },
  { id: "attendance", label: "2 & 3. Attendance & Shifts" },
  { id: "leaves", label: "4. Leave Management" },
  { id: "payroll", label: "5. Payroll & Payslips" },
  { id: "performance", label: "7. Performance" },
];

export function HrWorkspace() {
  const [role, setRole] = useState<HrRole>("HR Manager");
  const [activeTab, setActiveTab] = useState<HrTab>("dashboard");
  const [state, setState] = useState<HrState | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/hr/state"), {
          headers: { "x-hr-role": role },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load HR state.");
        }
        if (!cancelled) {
          setState(data as HrState);
        }
      } catch (err) {
        if (!cancelled) {
          setBanner({
            type: "error",
            text:
              err instanceof Error ? err.message : "Could not reach HR API.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function refreshState() {
    const res = await fetch(apiUrl("/api/hr/state"), {
      headers: { "x-hr-role": role },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to refresh HR state.");
    }
    setState(data as HrState);
  }

  async function mutate(
    path: string,
    method: "POST" | "PATCH",
    body: unknown,
    successMessage: string
  ): Promise<boolean> {
    setBanner(null);
    try {
      const res = await fetch(apiUrl(path), {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-hr-role": role,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "HR operation failed.");
      }
      await refreshState();
      setBanner({ type: "success", text: successMessage });
      return true;
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Operation failed.",
      });
      return false;
    }
  }

  const activeStaff =
    state?.employees.filter((e) => e.employmentStatus === "Active").length ?? 0;
  const pendingLeaves =
    state?.leaves.filter((l) => l.status === "Pending").length ?? 0;
  const monthlyPayroll =
    state?.payroll.reduce((s, p) => s + p.netPay, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#E2E9EB] px-4 py-6 text-[#14191B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/80 bg-[#EDF2F3] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#181C1E] px-3 py-1 text-[11px] font-semibold text-white">
                Module 13 • HR & Staff
              </span>
              <Link
                href="/"
                className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#47565C] transition hover:bg-[#F8FAFA]"
              >
                ← Back to Hub
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#14191B]">
              HR & Staff Management
            </h1>
            <p className="text-xs text-[#6B7A80]">
              Employee onboarding, department assignments, attendance &
              overtime, conflict-free shift scheduling, leave approvals,
              integrated payroll & PDF payslips, and appraisals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] border border-white/90 bg-[#F8FAFA] px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A80]">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as HrRole);
                setBanner(null);
              }}
              className="rounded-full border border-[#DCE4E7] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14191B] focus:border-[#4A90A4] focus:outline-none"
            >
              {HR_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Active Employees",
              value: `${activeStaff} / ${state?.employees.length ?? 0}`,
              accent: "bg-[#6AB4A4]",
            },
            {
              label: "Scheduled Shifts",
              value: String(state?.shifts.length ?? 0),
              accent: "bg-[#8FC1CE]",
            },
            {
              label: "Pending Leaves",
              value: String(pendingLeaves),
              accent: "bg-[#EB9B52]",
            },
            {
              label: "Payroll Processed",
              value: formatMoney(monthlyPayroll),
              accent: "bg-[#4A90A4]",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-[24px] border border-white/80 bg-[#EDF2F3] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6B7A80]">
                  {kpi.label}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${kpi.accent}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#14191B]">
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        <nav className="flex flex-wrap gap-1.5 rounded-[26px] border border-white/80 bg-[#EDF2F3] p-2">
          {HR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[#181C1E] text-white"
                  : "bg-transparent text-[#47565C] hover:bg-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {banner && (
          <div
            className={`flex items-center justify-between rounded-[20px] px-4 py-3 text-xs font-semibold ${
              banner.type === "success"
                ? "bg-[#E4F4F0] text-[#1F6355]"
                : "bg-[#FCEBE7] text-[#B8381B]"
            }`}
          >
            <span>{banner.text}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="ml-4 opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading || !state ? (
          <div className="rounded-[28px] border border-white/80 bg-[#EDF2F3] p-12 text-center text-sm text-[#6B7A80]">
            Loading HR & Staff workspace...
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <HrDashboardSection
                employees={state.employees}
                attendance={state.attendance}
                leaves={state.leaves}
                payroll={state.payroll}
                performanceReviews={state.performanceReviews}
                auditLogs={state.auditLogs}
              />
            )}

            {activeTab === "employees" && (
              <EmployeesSection
                employees={state.employees}
                assignments={state.assignments}
                canManageEmployees={hasHrPermission(role, "hr:employee:manage")}
                canAssignDepartment={hasHrPermission(
                  role,
                  "hr:department:assign"
                )}
                onRegisterEmployee={(payload) =>
                  mutate(
                    "/api/hr/employees",
                    "POST",
                    payload,
                    `Employee "${payload.fullName}" registered.`
                  )
                }
                onAssignDepartment={(payload) =>
                  mutate(
                    "/api/hr/assignments",
                    "POST",
                    payload,
                    `${payload.changeType} recorded for ${payload.employeeId}.`
                  )
                }
              />
            )}

            {activeTab === "attendance" && (
              <AttendanceShiftsSection
                employees={state.employees}
                attendance={state.attendance}
                shifts={state.shifts}
                canManageAttendance={hasHrPermission(
                  role,
                  "hr:attendance:manage"
                )}
                canManageShifts={hasHrPermission(role, "hr:shift:manage")}
                onRecordAttendance={(payload) =>
                  mutate(
                    "/api/hr/attendance",
                    "POST",
                    payload,
                    `Attendance recorded for ${payload.attendanceDate}.`
                  )
                }
                onCreateShift={(payload) =>
                  mutate(
                    "/api/hr/shifts",
                    "POST",
                    payload,
                    `${payload.shiftName} scheduled for ${payload.shiftDate}.`
                  )
                }
              />
            )}

            {activeTab === "leaves" && (
              <LeaveManagementSection
                employees={state.employees}
                leaves={state.leaves}
                canApply={hasHrPermission(role, "hr:leave:apply")}
                canApprove={hasHrPermission(role, "hr:leave:approve")}
                onApplyLeave={(payload) =>
                  mutate(
                    "/api/hr/leaves",
                    "POST",
                    payload,
                    `${payload.leaveType} leave request submitted.`
                  )
                }
                onReviewLeave={async (payload) => {
                  await mutate(
                    "/api/hr/leaves",
                    "PATCH",
                    payload,
                    `Leave request ${payload.leaveId} marked ${payload.status}.`
                  );
                }}
              />
            )}

            {activeTab === "payroll" && (
              <PayrollSection
                employees={state.employees}
                payroll={state.payroll}
                canManagePayroll={hasHrPermission(role, "hr:payroll:manage")}
                onGeneratePayroll={(payload) =>
                  mutate(
                    "/api/hr/payroll",
                    "POST",
                    payload,
                    `Monthly payroll generated for ${payload.payrollMonth}.`
                  )
                }
                onUpdatePayrollStatus={async (payload) => {
                  await mutate(
                    "/api/hr/payroll",
                    "PATCH",
                    payload,
                    `Payroll ${payload.payrollId} marked ${payload.status}.`
                  );
                }}
              />
            )}

            {activeTab === "performance" && (
              <PerformanceSection
                employees={state.employees}
                reviews={state.performanceReviews}
                canManage={hasHrPermission(role, "hr:performance:manage")}
                onCreateReview={(payload) =>
                  mutate(
                    "/api/hr/performance",
                    "POST",
                    payload,
                    `Performance evaluation recorded (${payload.rating}/5).`
                  )
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
