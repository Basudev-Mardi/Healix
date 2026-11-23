import type { Metadata } from "next";
import { HrWorkspace } from "@/components/hr/HrWorkspace";

export const metadata: Metadata = {
  title: "HR & Staff Management | Healix HMS",
  description:
    "End-to-end HR & Staff Management covering Employee Registration, Attendance, Shift Scheduling, Leave Management, Payroll & Payslips, Department Assignments, and Performance Evaluations.",
};

export default function HrPage() {
  return <HrWorkspace />;
}
