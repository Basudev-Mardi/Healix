import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Ambulance Operators Dashboard | Healix HMS",
  description: "Independent dashboard for Ambulance Operators role.",
};

export default function AmbulanceOperatorsDashboardPage() {
  return (
    <DashboardView
      roleName="Ambulance Operators"
      category="Specialist Role"
      department="Emergency Medical Services & Fleet Dispatch"
      subtitle="Live ambulance dispatch status, ALS/BLS fleet readiness, ETA tracking, and equipment checks."
      kpis={[
        {
          label: "Active Fleet Units",
          value: "10 / 12",
          detail: "6 ALS, 4 BLS on duty • 2 in maintenance",
          tone: "success",
        },
        {
          label: "Units On Active Dispatch",
          value: "4",
          detail: "2 inbound to ER, 2 inter-facility transfers",
          tone: "danger",
        },
        {
          label: "Standby Ready Units",
          value: "6",
          detail: "Stationed across 3 dispatch zones",
          tone: "info",
        },
        {
          label: "Average Response Time",
          value: "7.4 m",
          detail: "Target urban response: < 8 minutes",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Live Dispatch Board",
          description: "Currently deployed ambulances and real-time route status.",
          items: [
            {
              title: "AMB-07 (ALS) • Code Stroke Pickup",
              subtitle: "En route to Healix Central ER Bay",
              meta: "ETA 4 mins",
              status: "Priority 1",
              tone: "danger",
            },
            {
              title: "AMB-12 (ALS) • Respiratory Distress",
              subtitle: "Paramedic team administering O2 en route",
              meta: "ETA 11 mins",
              status: "Inbound",
              tone: "warning",
            },
            {
              title: "AMB-04 (BLS) • Inter-Hospital Transfer",
              subtitle: "Stable cardiac patient to North Campus",
              meta: "18 mins out",
              status: "En Route",
              tone: "info",
            },
          ],
        },
        {
          title: "Fleet & Onboard Equipment Readiness",
          description: "Vehicle fuel, oxygen cylinders, and defibrillator checks.",
          items: [
            {
              title: "AMB-02 • Post-Trip Decontamination",
              subtitle: "Bay 2 wash & consumables restock",
              meta: "Ready in 15m",
              status: "Restocking",
              tone: "warning",
            },
            {
              title: "AMB-09 • Defibrillator & O2 Check",
              subtitle: "Battery 100% • Main O2 tank 1,950 PSI",
              meta: "Checked 07:00 AM",
              status: "Ready",
              tone: "success",
            },
            {
              title: "AMB-11 • Scheduled Brake Inspection",
              subtitle: "Fleet workshop bay • Out of service",
              meta: "Returns tomorrow",
              status: "Maintenance",
              tone: "neutral",
            },
          ],
        },
      ]}
    />
  );
}
