import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "ICU Staff Dashboard | Healix HMS",
  description: "Independent dashboard for ICU Staff role.",
};

export default function ICUStaffDashboardPage() {
  return (
    <DashboardView
      roleName="ICU Staff"
      category="Specialist Role"
      department="Intensive Care Unit (Critical Care)"
      subtitle="ICU bed acuity, mechanical ventilation telemetry, vasopressor infusions, and critical care alerts."
      kpis={[
        {
          label: "ICU Beds Occupied",
          value: "18 / 20",
          detail: "2 beds open (1 reserved for ER transfer)",
          tone: "warning",
        },
        {
          label: "Ventilated Patients",
          value: "11",
          detail: "2 undergoing spontaneous breathing trials",
          tone: "info",
        },
        {
          label: "Active Hemodynamic Alerts",
          value: "2",
          detail: "ICU-03 & ICU-11 MAP thresholds",
          tone: "danger",
        },
        {
          label: "Step-Down Candidates",
          value: "3",
          detail: "Cleared for Ward transfer today",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Critical Care Bed Monitor",
          description: "High-acuity patients requiring continuous critical care oversight.",
          items: [
            {
              title: "ICU-03 • Septic Shock (67M)",
              subtitle: "Ventilator AC/VC • Norepinephrine 0.14 mcg/kg/min",
              meta: "MAP 64 mmHg",
              status: "Critical",
              tone: "danger",
            },
            {
              title: "ICU-07 • Post-CABG Recovery (59F)",
              subtitle: "Extubated 2h ago • Chest tube output minimal",
              meta: "SpO2 98%",
              status: "Stabilizing",
              tone: "success",
            },
            {
              title: "ICU-11 • Acute Respiratory Failure (72M)",
              subtitle: "High-flow nasal cannula • ABG due in 20m",
              meta: "FiO2 60%",
              status: "Watch",
              tone: "warning",
            },
          ],
        },
        {
          title: "Critical Care Bundles & Rounds",
          description: "Daily ICU compliance checks and multidisciplinary rounds.",
          items: [
            {
              title: "VAP & CLABSI Prevention Bundle",
              subtitle: "18 / 18 beds audited on morning shift",
              meta: "100% compliant",
              status: "Verified",
              tone: "success",
            },
            {
              title: "Multidisciplinary ICU Rounds",
              subtitle: "Intensivist, Pharmacist, Respiratory Therapist",
              meta: "In progress",
              status: "Active",
              tone: "info",
            },
            {
              title: "Incoming ER-to-ICU Transfer",
              subtitle: "Bed ICU-09 ventilator pre-check complete",
              meta: "ETA 10 mins",
              status: "Preparing",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
