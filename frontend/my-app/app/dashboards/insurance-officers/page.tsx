import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Insurance Officers Dashboard | Healix HMS",
  description: "Independent dashboard for Insurance Officers role.",
};

export default function InsuranceOfficersDashboardPage() {
  return (
    <DashboardView
      roleName="Insurance Officers"
      category="Specialist Role"
      department="Insurance Desk & TPA Claims"
      subtitle="Pre-authorization requests, cashless claim approvals, payer queries, and denial follow-ups."
      kpis={[
        {
          label: "Pending Pre-Authorizations",
          value: "19",
          detail: "6 urgent surgical admissions today",
          tone: "warning",
        },
        {
          label: "Approved Cashless Claims",
          value: "46",
          detail: "Total sanctioned today: $192,400",
          tone: "success",
        },
        {
          label: "Payer Queries Open",
          value: "8",
          detail: "Additional clinical notes requested",
          tone: "danger",
        },
        {
          label: "First-Pass Approval Rate",
          value: "91.5%",
          detail: "Rolling 30-day clean claim rate",
          tone: "info",
        },
      ]}
      sections={[
        {
          title: "Pre-Authorization Queue",
          description: "Active coverage verifications for planned and emergency admissions.",
          items: [
            {
              title: "AUTH-3109 • Cardiac Bypass (OT-01)",
              subtitle: "Payer: Apex Health TPA • Est. $28,500",
              meta: "Submitted 08:30",
              status: "Approved",
              tone: "success",
            },
            {
              title: "AUTH-3114 • Orthopedic Spine Surgery",
              subtitle: "Payer: MetroCare Insurance • MRI notes requested",
              meta: "Query 40m ago",
              status: "Query Raised",
              tone: "danger",
            },
            {
              title: "AUTH-3119 • Emergency ICU Admission",
              subtitle: "Payer: National Shield • 24h emergency intimation",
              meta: "Under review",
              status: "Pending",
              tone: "warning",
            },
          ],
        },
        {
          title: "Final Claim Settlements",
          description: "Discharge claim packages submitted to insurance carriers.",
          items: [
            {
              title: "CLM-8821 • Ward A-04 Discharge",
              subtitle: "Final enhancement sanctioned ($9,120)",
              meta: "Cleared 10:05 AM",
              status: "Sanctioned",
              tone: "success",
            },
            {
              title: "CLM-8827 • Oncology Daycare Batch",
              subtitle: "12 chemotherapy cycle claims uploaded",
              meta: "Submitted today",
              status: "In Process",
              tone: "info",
            },
            {
              title: "CLM-8790 • Partial Deduction Appeal",
              subtitle: "Consumables exclusion disputed with payer",
              meta: "Follow-up due",
              status: "Appealed",
              tone: "warning",
            },
          ],
        },
      ]}
    />
  );
}
