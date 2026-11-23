import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Billing Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Billing Staff role.",
};

export default function BillingStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Billing Staff"
      category="Core Role"
      department="Revenue Cycle & Patient Billing"
      subtitle="Discharge invoices, outpatient collections, pending settlements, and coding verification."
      kpis={[
        {
          label: "Invoices Generated Today",
          value: "142",
          detail: "118 OPD, 24 IPD final bills",
          tone: "info",
        },
        {
          label: "Collections Today",
          value: "$84,650",
          detail: "Card, cash, and digital settlements",
          tone: "success",
        },
        {
          label: "Pending Discharge Bills",
          value: "11",
          detail: "Awaiting pharmacy/lab charge lock",
          tone: "warning",
        },
        {
          label: "Flagged Charge Audits",
          value: "3",
          detail: "Code mismatch or duplicate entry",
          tone: "danger",
        },
      ]}
      sections={[
        {
          title: "Discharge Billing Queue",
          description: "Inpatient accounts awaiting final invoice clearance.",
          items: [
            {
              title: "INV-2026-8841 • Ward C-08",
              subtitle: "Self-pay + co-pay split • Total $6,420",
              meta: "Discharge 12:30 PM",
              status: "Pending Payment",
              tone: "warning",
            },
            {
              title: "INV-2026-8844 • Ward A-04",
              subtitle: "Insurance pre-approved • Co-pay $350",
              meta: "Cleared",
              status: "Settled",
              tone: "success",
            },
            {
              title: "INV-2026-8849 • Surgical Ward B-14",
              subtitle: "OT consumables reconciliation in progress",
              meta: "Hold 15m",
              status: "Auditing",
              tone: "info",
            },
          ],
        },
        {
          title: "Counter Reconciliation & Refunds",
          description: "Daily billing desk balances and adjustment tickets.",
          items: [
            {
              title: "OPD Counter #1 Shift Balance",
              subtitle: "64 receipts matched with POS terminal",
              meta: "$12,840",
              status: "Matched",
              tone: "success",
            },
            {
              title: "Duplicate Lab Charge Adjustment",
              subtitle: "Account MRN-66320 • Refund $95",
              meta: "Pending approval",
              status: "Review",
              tone: "warning",
            },
            {
              title: "Corporate TPA Batch Invoice",
              subtitle: "19 accounts bundled for weekly submission",
              meta: "Ready",
              status: "Queued",
              tone: "info",
            },
          ],
        },
      ]}
    />
  );
}
