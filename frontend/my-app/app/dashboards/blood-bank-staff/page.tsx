import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Blood Bank Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Blood Bank Staff role.",
};

export default function BloodBankStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Blood Bank Staff"
      category="Core Role"
      department="Transfusion Medicine & Blood Bank"
      subtitle="Blood component inventory by group, cross-match requests, donor screening, and cold storage."
      kpis={[
        {
          label: "Total Packed RBC Units",
          value: "148",
          detail: "Across all 8 ABO/Rh blood groups",
          tone: "success",
        },
        {
          label: "Critical Low Blood Groups",
          value: "2",
          detail: "O- (4 units) & AB- (3 units)",
          tone: "danger",
        },
        {
          label: "Pending Cross-Matches",
          value: "7",
          detail: "2 urgent requests from ER & OT-08",
          tone: "warning",
        },
        {
          label: "Donors Scheduled Today",
          value: "18",
          detail: "11 screened & donated so far",
          tone: "info",
        },
      ]}
      sections={[
        {
          title: "Urgent Cross-Match & Issue Queue",
          description: "Active blood product requisitions awaiting release.",
          items: [
            {
              title: "REQ-771 • 4 Units O- Packed RBC",
              subtitle: "Massive transfusion alert • Emergency Trauma Bay 2",
              meta: "Immediate",
              status: "Emergency Issue",
              tone: "danger",
            },
            {
              title: "REQ-774 • 2 Units A+ Fresh Frozen Plasma",
              subtitle: "OT-01 Cardiac Surgery • Thawing in progress",
              meta: "12 mins left",
              status: "Preparing",
              tone: "warning",
            },
            {
              title: "REQ-778 • 1 Unit B+ Platelets",
              subtitle: "Oncology Ward C-02 • Cross-match compatible",
              meta: "Ready for pickup",
              status: "Cleared",
              tone: "success",
            },
          ],
        },
        {
          title: "Inventory & Cold-Chain Monitoring",
          description: "Component shelf-life and blood refrigerator telemetry.",
          items: [
            {
              title: "O-Negative Reserve Threshold",
              subtitle: "4 units available • Regional bank replenishment requested",
              meta: "Min target: 10",
              status: "Critical Low",
              tone: "danger",
            },
            {
              title: "Blood Bank Refrigerator #BB-01",
              subtitle: "Temperature steady at 3.8°C",
              meta: "Range 2°C - 6°C",
              status: "Normal",
              tone: "success",
            },
            {
              title: "Platelet Agitator #PA-02",
              subtitle: "24 units active • 22.1°C continuous agitation",
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
