import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Biomedical Engineering Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Biomedical Engineering Staff role.",
};

export default function BiomedicalEngineeringStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Biomedical Engineering Staff"
      category="Specialist Role"
      department="Clinical Engineering & Medical Equipment"
      subtitle="Medical device uptime, breakdown tickets, preventive maintenance schedules, and calibration."
      kpis={[
        {
          label: "Active Medical Assets",
          value: "1,284",
          detail: "98.6% fleet operational uptime",
          tone: "success",
        },
        {
          label: "Open Breakdown Tickets",
          value: "5",
          detail: "1 critical ICU infusion pump fault",
          tone: "danger",
        },
        {
          label: "PM Calibrations Due",
          value: "16",
          detail: "Scheduled across next 7 days",
          tone: "warning",
        },
        {
          label: "Loaner Units Available",
          value: "22",
          detail: "Ventilators, monitors, and pumps ready",
          tone: "info",
        },
      ]}
      sections={[
        {
          title: "Active Repair & Breakdown Queue",
          description: "Reported clinical device faults prioritized by patient impact.",
          items: [
            {
              title: "BM-4012 • Syringe Infusion Pump (ICU)",
              subtitle: "Occlusion sensor alarm • Loaner swapped in",
              meta: "Bench testing",
              status: "High Priority",
              tone: "danger",
            },
            {
              title: "BM-4019 • Patient Monitor #PM-28 (ER)",
              subtitle: "SpO2 module intermittent signal",
              meta: "Assigned Eng #03",
              status: "In Repair",
              tone: "warning",
            },
            {
              title: "BM-4024 • Autoclave #CSSD-02 Sensor",
              subtitle: "Pressure transducer replaced and tested",
              meta: "Signed off",
              status: "Resolved",
              tone: "success",
            },
          ],
        },
        {
          title: "Preventive Maintenance & Calibration",
          description: "Regulatory safety testing and OEM service schedules.",
          items: [
            {
              title: "MRI 3T Cryogen & Coil Inspection",
              subtitle: "OEM engineer scheduled Sunday 06:00 AM",
              meta: "Planned",
              status: "Scheduled",
              tone: "info",
            },
            {
              title: "Defibrillator Quarterly Discharge Test",
              subtitle: "32 of 34 crash-cart units certified",
              meta: "2 remaining",
              status: "In Progress",
              tone: "warning",
            },
            {
              title: "OT Anesthesia Workstation Calibration",
              subtitle: "All 8 suites passed leak & O2 sensor check",
              meta: "Certified",
              status: "Compliant",
              tone: "success",
            },
          ],
        },
      ]}
    />
  );
}
