import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Emergency Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Emergency Staff role.",
};

export default function EmergencyStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Emergency Staff"
      category="Core Role"
      department="Emergency Department & Trauma Triage"
      subtitle="Live triage acuity, trauma bay readiness, incoming ambulance alerts, and resuscitation status."
      kpis={[
        {
          label: "Active ER Cases",
          value: "24",
          detail: "3 Resuscitation, 8 Emergent, 13 Urgent",
          tone: "danger",
        },
        {
          label: "Available Trauma Bays",
          value: "3 / 6",
          detail: "Bay 1, 4, 6 stocked and ready",
          tone: "warning",
        },
        {
          label: "Inbound Ambulances",
          value: "2",
          detail: "Nearest ETA: 4 minutes",
          tone: "danger",
        },
        {
          label: "Median Door-to-Triage",
          value: "4.2 m",
          detail: "Within 5-minute protocol target",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Active Triage Board",
          description: "Prioritized emergency cases by clinical acuity.",
          items: [
            {
              title: "Trauma Bay 2 • Polytrauma (RTA)",
              subtitle: "ESI Level 1 • Surgery & Blood Bank notified",
              meta: "Admitted 12m ago",
              status: "Critical",
              tone: "danger",
            },
            {
              title: "Bay 5 • Acute Chest Pain (58M)",
              subtitle: "ESI Level 2 • Stat ECG & Troponin ordered",
              meta: "Admitted 19m ago",
              status: "Emergent",
              tone: "warning",
            },
            {
              title: "Bay 9 • Pediatric Febrile Seizure",
              subtitle: "ESI Level 2 • Stabilized, observation ongoing",
              meta: "Admitted 35m ago",
              status: "Monitoring",
              tone: "info",
            },
          ],
        },
        {
          title: "Pre-Hospital & Transfer Alerts",
          description: "Inbound EMS notifications and inpatient ICU/Ward transfers.",
          items: [
            {
              title: "EMS Unit #AMB-07 • Suspected Stroke",
              subtitle: "CT scanner pre-alerted • ETA 4 mins",
              meta: "Inbound",
              status: "Code Stroke",
              tone: "danger",
            },
            {
              title: "EMS Unit #AMB-12 • Respiratory Distress",
              subtitle: "SpO2 88% on O2 • ETA 11 mins",
              meta: "Inbound",
              status: "High Priority",
              tone: "warning",
            },
            {
              title: "ICU Transfer • ER-1104",
              subtitle: "Bed ICU-09 assigned, escort dispatched",
              meta: "In transit",
              status: "Transferring",
              tone: "success",
            },
          ],
        },
      ]}
    />
  );
}
