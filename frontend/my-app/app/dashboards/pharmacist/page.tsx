import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Pharmacist Dashboard | Healix HMS",
  description: "Independent dashboard for Pharmacist role.",
};

export default function PharmacistDashboardPage() {
  return (
    <DashboardView
      roleName="Pharmacist"
      category="Core Role"
      department="Hospital Pharmacy & Medication Safety"
      subtitle="Prescription verification queue, inpatient dispensing, controlled substance logs, and stock alerts."
      kpis={[
        {
          label: "Prescriptions Pending",
          value: "31",
          detail: "8 inpatient STAT, 23 OPD scripts",
          tone: "warning",
        },
        {
          label: "Orders Dispensed Today",
          value: "189",
          detail: "99.4% barcode scan compliance",
          tone: "success",
        },
        {
          label: "Low-Stock Formulary Items",
          value: "6",
          detail: "2 critical care IV drugs below par",
          tone: "danger",
        },
        {
          label: "Near-Expiry Batches",
          value: "9",
          detail: "Expiring within next 30 days",
          tone: "warning",
        },
      ]}
      sections={[
        {
          title: "Dispensing & Verification Queue",
          description: "Orders awaiting pharmacist clinical check and release.",
          items: [
            {
              title: "RX-44108 • Vancomycin 1g IV",
              subtitle: "ICU Bed 03 • Renal dose verification required",
              meta: "STAT Order",
              status: "Verify",
              tone: "danger",
            },
            {
              title: "RX-44112 • Discharge Medication Pack",
              subtitle: "Ward A-11 • 5 oral medications counseling",
              meta: "Due 11:15 AM",
              status: "Packing",
              tone: "info",
            },
            {
              title: "RX-44119 • Pediatric Amoxicillin Susp.",
              subtitle: "OPD Counter 2 • Label printed",
              meta: "Ready",
              status: "Dispensed",
              tone: "success",
            },
          ],
        },
        {
          title: "Inventory & Controlled Drug Alerts",
          description: "Critical formulary stock levels and narcotics balance.",
          items: [
            {
              title: "Norepinephrine 4mg/4mL Ampoules",
              subtitle: "Central Pharmacy: 18 units remaining",
              meta: "Par level: 50",
              status: "Critical Low",
              tone: "danger",
            },
            {
              title: "Schedule II Narcotics Vault Count",
              subtitle: "Morning dual-signoff reconciliation",
              meta: "Verified 08:00 AM",
              status: "Balanced",
              tone: "success",
            },
            {
              title: "Cold-Chain Insulin Storage",
              subtitle: "Fridge #PH-02 temp: 4.1°C",
              meta: "Nominal",
              status: "Healthy",
              tone: "info",
            },
          ],
        },
      ]}
    />
  );
}
