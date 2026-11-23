import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "OT Manager Dashboard | Healix HMS",
  description: "Independent dashboard for OT Manager role.",
};

export default function OTManagerDashboardPage() {
  return (
    <DashboardView
      roleName="OT Manager"
      category="Core Role"
      department="Operating Theatres & Surgical Scheduling"
      subtitle="Live theatre utilization, surgical schedule, CSSD sterile kit readiness, and PACU recovery beds."
      kpis={[
        {
          label: "Active Operating Theatres",
          value: "6 / 8",
          detail: "1 in turnover, 1 held for trauma",
          tone: "info",
        },
        {
          label: "Surgeries Scheduled Today",
          value: "19",
          detail: "7 completed, 6 in progress, 6 upcoming",
          tone: "success",
        },
        {
          label: "Emergency OT Cases",
          value: "1",
          detail: "OT-08 activated for trauma surgery",
          tone: "danger",
        },
        {
          label: "PACU Recovery Beds Free",
          value: "4 / 10",
          detail: "6 post-op patients monitoring",
          tone: "warning",
        },
      ]}
      sections={[
        {
          title: "Operating Theatre Live Board",
          description: "Current surgical status across theatre suites.",
          items: [
            {
              title: "OT-01 • Coronary Artery Bypass (CABG)",
              subtitle: "Lead: Dr. A. Sen • Anesthesia: Dr. M. Roy",
              meta: "Started 08:15 AM",
              status: "In Surgery",
              tone: "info",
            },
            {
              title: "OT-04 • Total Knee Replacement",
              subtitle: "Lead: Dr. S. Kapoor • Closing phase",
              meta: "Est. end 11:00 AM",
              status: "Closing",
              tone: "success",
            },
            {
              title: "OT-08 • Emergency Exploratory Laparotomy",
              subtitle: "Trauma transfer from ER Bay 2",
              meta: "Prepping now",
              status: "Emergency",
              tone: "danger",
            },
          ],
        },
        {
          title: "Pre-Op & Sterile Readiness",
          description: "CSSD instrument sets, checklists, and turnover times.",
          items: [
            {
              title: "WHO Surgical Safety Checklists",
              subtitle: "All 6 upcoming cases pre-verified",
              meta: "100% signed",
              status: "Compliant",
              tone: "success",
            },
            {
              title: "Laparoscopic Tray #CSSD-44",
              subtitle: "Autoclave cycle completed for OT-03",
              meta: "Delivered",
              status: "Sterile",
              tone: "info",
            },
            {
              title: "OT-02 Deep Sterilization Turnover",
              subtitle: "Scheduled 11:30 AM Neurosurgery case",
              meta: "18 mins left",
              status: "Cleaning",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
