import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Laboratory Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Laboratory Staff role.",
};

export default function LaboratoryStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Laboratory Staff"
      category="Core Role"
      department="Clinical Pathology & Diagnostics Lab"
      subtitle="Sample accessioning, analyzer queues, STAT test turnaround, and quality control status."
      kpis={[
        {
          label: "Samples Pending Analysis",
          value: "64",
          detail: "9 STAT samples prioritized",
          tone: "warning",
        },
        {
          label: "Completed Reports Today",
          value: "248",
          detail: "Avg turnaround: 42 minutes",
          tone: "success",
        },
        {
          label: "Critical Values Flagged",
          value: "3",
          detail: "2 acknowledged by physicians",
          tone: "danger",
        },
        {
          label: "Analyzers Online",
          value: "7 / 7",
          detail: "Daily QC passed across all benches",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "STAT & Priority Sample Queue",
          description: "Urgent specimens requiring immediate processing and validation.",
          items: [
            {
              title: "LAB-90412 • Cardiac Troponin I",
              subtitle: "Origin: Emergency Bay 5 • Biochemistry",
              meta: "14 min elapsed",
              status: "STAT",
              tone: "danger",
            },
            {
              title: "LAB-90415 • Arterial Blood Gas (ABG)",
              subtitle: "Origin: ICU Bed 04 • Critical Care Panel",
              meta: "9 min elapsed",
              status: "Processing",
              tone: "warning",
            },
            {
              title: "LAB-90419 • Complete Blood Count",
              subtitle: "Origin: OT-02 Pre-Op • Hematology",
              meta: "22 min elapsed",
              status: "Validating",
              tone: "info",
            },
          ],
        },
        {
          title: "Bench & Quality Control Status",
          description: "Instrument calibration and reagent availability.",
          items: [
            {
              title: "Hematology Analyzer #H-01",
              subtitle: "Control run within 1SD tolerance",
              meta: "Checked 07:30 AM",
              status: "QC Passed",
              tone: "success",
            },
            {
              title: "Microbiology Culture Incubators",
              subtitle: "42 active blood/urine cultures incubating",
              meta: "37.0°C nominal",
              status: "Running",
              tone: "info",
            },
            {
              title: "Coagulation Reagent Lot #CG-88",
              subtitle: "Stock below 20% threshold",
              meta: "Reorder flagged",
              status: "Low Stock",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
