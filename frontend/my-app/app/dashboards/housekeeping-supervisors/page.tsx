import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Housekeeping Supervisors Dashboard | Healix HMS",
  description: "Independent dashboard for Housekeeping Supervisors role.",
};

export default function HousekeepingSupervisorsDashboardPage() {
  return (
    <DashboardView
      roleName="Housekeeping Supervisors"
      category="Specialist Role"
      department="Environmental Services & Sanitation"
      subtitle="Room turnover schedules, terminal disinfection, biohazard waste pickup, and hygiene audits."
      kpis={[
        {
          label: "Rooms Pending Turnover",
          value: "9",
          detail: "3 priority inpatient beds, 1 OT suite",
          tone: "warning",
        },
        {
          label: "Turnovers Completed Today",
          value: "37",
          detail: "Avg bed sanitation time: 24 mins",
          tone: "success",
        },
        {
          label: "Terminal Disinfections",
          value: "4",
          detail: "UV-C & sporicidal protocol active",
          tone: "info",
        },
        {
          label: "Biohazard Waste Pickups",
          value: "12 / 14",
          detail: "2 scheduled for afternoon collection",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Priority Room & Bed Sanitation",
          description: "Live cleaning assignments coordinated with wards and theatres.",
          items: [
            {
              title: "OT-02 • Deep Sterile Turnover",
              subtitle: "Assigned: Team Alpha • Pre-neurosurgery prep",
              meta: "18 mins left",
              status: "In Progress",
              tone: "warning",
            },
            {
              title: "Ward Bed B-208 • Discharge Turnover",
              subtitle: "Assigned: Staff #HK-14 • Linen & surface sanitize",
              meta: "Requested 10:05",
              status: "Cleaning",
              tone: "info",
            },
            {
              title: "Isolation Room B-201 • Terminal Clean",
              subtitle: "ATP swab & supervisor sign-off passed",
              meta: "Completed 09:40",
              status: "Cleared",
              tone: "success",
            },
          ],
        },
        {
          title: "Waste Management & Linen Supply",
          description: "Regulated medical waste logs and floor linen par levels.",
          items: [
            {
              title: "ICU & ER Red-Bag Biohazard Run",
              subtitle: "Manifest logged • Transferred to holding bay",
              meta: "Completed 09:30",
              status: "Compliant",
              tone: "success",
            },
            {
              title: "Wing A Fresh Linen Cart Restock",
              subtitle: "Sheets and gowns replenished to 100% par",
              meta: "10:00 AM",
              status: "Stocked",
              tone: "info",
            },
            {
              title: "OPD Lobby Restroom Sanitization",
              subtitle: "Hourly inspection due at 11:00 AM",
              meta: "Upcoming",
              status: "Scheduled",
              tone: "neutral",
            },
          ],
        },
      ]}
    />
  );
}
