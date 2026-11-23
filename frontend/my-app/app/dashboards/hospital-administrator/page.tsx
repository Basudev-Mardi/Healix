import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Hospital Administrator Dashboard | Healix HMS",
  description: "Independent dashboard for Hospital Administrator role.",
};

export default function HospitalAdministratorDashboardPage() {
  return (
    <DashboardView
      roleName="Hospital Administrator"
      category="Core Role"
      department="Hospital Operations & Executive Management"
      subtitle="Hospital-wide occupancy, departmental throughput, staffing balance, and operational KPIs."
      kpis={[
        {
          label: "Bed Occupancy Rate",
          value: "84%",
          detail: "538 of 640 beds currently occupied",
          tone: "info",
        },
        {
          label: "Daily Admissions",
          value: "96",
          detail: "74 discharges scheduled today",
          tone: "success",
        },
        {
          label: "Average Length of Stay",
          value: "3.8 d",
          detail: "Target benchmark: 4.0 days",
          tone: "success",
        },
        {
          label: "Department Escalations",
          value: "4",
          detail: "2 staffing, 2 equipment capacity",
          tone: "warning",
        },
      ]}
      sections={[
        {
          title: "Department Capacity Snapshot",
          description: "Current utilization across primary hospital divisions.",
          items: [
            {
              title: "Inpatient Medical & Surgical Wards",
              subtitle: "312 / 360 beds active",
              meta: "87% occupied",
              status: "High Load",
              tone: "warning",
            },
            {
              title: "Emergency & Trauma Department",
              subtitle: "19 active bays • avg wait 14 min",
              meta: "Normal flow",
              status: "Stable",
              tone: "success",
            },
            {
              title: "Outpatient Clinics (OPD)",
              subtitle: "418 scheduled visits across 14 specialties",
              meta: "92% on-time",
              status: "On Track",
              tone: "info",
            },
          ],
        },
        {
          title: "Executive Approvals & Reviews",
          description: "Operational items requiring administrative oversight.",
          items: [
            {
              title: "Cardiology Wing Shift Expansion",
              subtitle: "Proposed night-shift nurse coverage update",
              meta: "Submitted 09:15",
              status: "Review",
              tone: "warning",
            },
            {
              title: "Monthly Clinical Quality Scorecard",
              subtitle: "Readmission and infection rate summary",
              meta: "Ready",
              status: "Published",
              tone: "success",
            },
            {
              title: "Operating Theatre Utilization Report",
              subtitle: "Weekly surgical block efficiency analysis",
              meta: "88% utilization",
              status: "Healthy",
              tone: "info",
            },
          ],
        },
      ]}
    />
  );
}
