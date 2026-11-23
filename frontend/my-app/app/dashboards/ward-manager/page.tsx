import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Ward Manager Dashboard | Healix HMS",
  description: "Independent dashboard for Ward Manager role.",
};

export default function WardManagerDashboardPage() {
  return (
    <DashboardView
      roleName="Ward Manager"
      category="Core Role"
      department="Inpatient Ward & Bed Allocation"
      subtitle="Ward bed census, admission requests, discharge turnovers, and nursing roster coverage."
      kpis={[
        {
          label: "Ward Occupancy",
          value: "42 / 48",
          detail: "87.5% occupied across Wing A & B",
          tone: "warning",
        },
        {
          label: "Beds Ready for Admission",
          value: "4",
          detail: "2 additional beds in housekeeping",
          tone: "success",
        },
        {
          label: "Pending Bed Transfers",
          value: "5",
          detail: "3 from ER, 2 step-down from ICU",
          tone: "info",
        },
        {
          label: "Nurse-to-Patient Ratio",
          value: "1 : 5",
          detail: "All shift slots filled",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Bed Turnover & Allocation",
          description: "Live status of incoming admissions and departing beds.",
          items: [
            {
              title: "Bed A-104 • Ready for ER Transfer",
              subtitle: "Sanitized and inspected • Assigned to MRN-91204",
              meta: "ETA 15 mins",
              status: "Reserved",
              tone: "info",
            },
            {
              title: "Bed B-208 • Post-Discharge Cleaning",
              subtitle: "Housekeeping notified at 10:05 AM",
              meta: "Est. ready 10:40",
              status: "Turning Over",
              tone: "warning",
            },
            {
              title: "Bed A-112 • Planned Afternoon Discharge",
              subtitle: "Summary signed; family pickup at 2:00 PM",
              meta: "Scheduled",
              status: "Clearing",
              tone: "success",
            },
          ],
        },
        {
          title: "Ward Staffing & Escalations",
          description: "Shift roster adherence and ward-level operational notes.",
          items: [
            {
              title: "Day Shift Nursing Roster",
              subtitle: "9 RNs + 3 Ward Assistants on floor",
              meta: "07:00 - 15:00",
              status: "Full Staff",
              tone: "success",
            },
            {
              title: "Isolation Room B-201 Readiness",
              subtitle: "Negative-pressure check completed",
              meta: "Verified",
              status: "Active",
              tone: "info",
            },
            {
              title: "Evening Shift Float Request",
              subtitle: "1 extra nurse requested for high-acuity bay",
              meta: "Sent to HR",
              status: "Pending",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
