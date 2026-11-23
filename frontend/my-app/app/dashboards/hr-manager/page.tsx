import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "HR Manager Dashboard | Healix HMS",
  description: "Independent dashboard for HR Manager role.",
};

export default function HRManagerDashboardPage() {
  return (
    <DashboardView
      roleName="HR Manager"
      category="Core Role"
      department="Human Resources & Clinical Workforce"
      subtitle="Hospital staff attendance, shift rosters, medical credentialing renewals, and leave requests."
      kpis={[
        {
          label: "Staff On Duty Today",
          value: "612",
          detail: "96.8% scheduled shift coverage",
          tone: "success",
        },
        {
          label: "Pending Leave Requests",
          value: "14",
          detail: "6 nursing, 4 allied health, 4 admin",
          tone: "warning",
        },
        {
          label: "Expiring Medical Licenses",
          value: "5",
          detail: "Renewals due within 30 days",
          tone: "danger",
        },
        {
          label: "Open Clinical Positions",
          value: "9",
          detail: "4 ICU Nurses, 3 Lab Techs, 2 Residents",
          tone: "info",
        },
      ]}
      sections={[
        {
          title: "Credentialing & Compliance",
          description: "Licensure, BLS/ACLS certifications, and onboarding status.",
          items: [
            {
              title: "ACLS Certification Renewals (ICU/ER)",
              subtitle: "3 staff members scheduled for recertification",
              meta: "Due in 12 days",
              status: "Action Needed",
              tone: "warning",
            },
            {
              title: "New Resident Onboarding Cohort",
              subtitle: "8 incoming clinicians • Background checks cleared",
              meta: "Starts Mon",
              status: "On Track",
              tone: "success",
            },
            {
              title: "Medical Board License Verification",
              subtitle: "2 specialist registrations awaiting upload",
              meta: "Overdue 2d",
              status: "Urgent",
              tone: "danger",
            },
          ],
        },
        {
          title: "Roster & Leave Approvals",
          description: "Department shift coverage and staffing adjustments.",
          items: [
            {
              title: "Ward B Evening Float Nurse Request",
              subtitle: "Submitted by Ward Manager for high acuity",
              meta: "10:15 AM",
              status: "Pending",
              tone: "warning",
            },
            {
              title: "Monthly Payroll Attendance Lock",
              subtitle: "Biometric & shift differential sync at 98%",
              meta: "Closes Fri",
              status: "In Progress",
              tone: "info",
            },
            {
              title: "Radiology Weekend Call Schedule",
              subtitle: "Published and acknowledged by all staff",
              meta: "Confirmed",
              status: "Approved",
              tone: "success",
            },
          ],
        },
      ]}
    />
  );
}
