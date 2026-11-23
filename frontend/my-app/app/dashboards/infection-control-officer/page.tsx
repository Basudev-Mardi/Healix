import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Infection Control Officer Dashboard | Healix HMS",
  description: "Independent dashboard for Infection Control Officer role.",
};

export default function InfectionControlOfficerDashboardPage() {
  return (
    <DashboardView
      roleName="Infection Control Officer"
      category="Specialist Role"
      department="Infection Prevention & Hospital Epidemiology"
      subtitle="HAI surveillance, isolation room tracking, antimicrobial stewardship, and hand hygiene audits."
      kpis={[
        {
          label: "Active Isolation Patients",
          value: "7",
          detail: "4 Contact, 2 Droplet, 1 Airborne",
          tone: "warning",
        },
        {
          label: "Hand Hygiene Compliance",
          value: "94.2%",
          detail: "Monthly target: >= 90% hospital-wide",
          tone: "success",
        },
        {
          label: "MDRO Lab Alerts (24h)",
          value: "2",
          detail: "MRSA & ESBL isolates under review",
          tone: "danger",
        },
        {
          label: "Sterilization Audits Passed",
          value: "100%",
          detail: "CSSD biological indicators negative",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Surveillance & Isolation Alerts",
          description: "Active communicable cases and microbiology resistance flags.",
          items: [
            {
              title: "Isolation Room B-201 • Airborne Precaution",
              subtitle: "Negative pressure verified (-12 Pa) • N95 signage active",
              meta: "Day 3",
              status: "Monitored",
              tone: "warning",
            },
            {
              title: "Lab Isolate #MB-442 • MRSA Positive",
              subtitle: "Ward C-04 wound swab • Contact isolation initiated",
              meta: "Flagged 09:20",
              status: "Alert",
              tone: "danger",
            },
            {
              title: "ICU CLABSI / CAUTI Weekly Review",
              subtitle: "Zero new device-associated infections this week",
              meta: "Updated today",
              status: "On Target",
              tone: "success",
            },
          ],
        },
        {
          title: "Stewardship & Environmental Audits",
          description: "Antibiotic review rounds and water/air quality checks.",
          items: [
            {
              title: "Restricted Antibiotic 48h Review",
              subtitle: "6 Meropenem/Vancomycin courses due for de-escalation check",
              meta: "With Pharmacy",
              status: "Pending",
              tone: "warning",
            },
            {
              title: "OT-01 to OT-08 Air Particle Count",
              subtitle: "HEPA filtration within ISO Class 5 threshold",
              meta: "Tested Mon",
              status: "Passed",
              tone: "success",
            },
            {
              title: "Quarterly Staff Vaccination Log",
              subtitle: "97.4% seasonal influenza coverage achieved",
              meta: "Active drive",
              status: "Healthy",
              tone: "info",
            },
          ],
        },
      ]}
    />
  );
}
