import type { Metadata } from "next";
import { BillingWorkspace } from "@/components/billing/BillingWorkspace";

export const metadata: Metadata = {
  title: "Billing & Finance Management | Healix HMS",
  description:
    "Unified hospital Billing & Finance Management covering OPD, IPD, Surgery, Laboratory, Pharmacy billing, Insurance Claims, Refunds, PDF Invoices, and Financial Reports.",
};

export default function BillingPage() {
  return <BillingWorkspace />;
}
