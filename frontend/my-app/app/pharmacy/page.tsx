import type { Metadata } from "next";
import { PharmacyWorkspace } from "@/components/pharmacy/PharmacyWorkspace";

export const metadata: Metadata = {
  title: "Pharmacy Management | Healix HMS",
  description:
    "End-to-end Pharmacy Management covering Medicine Catalog, Prescriptions, FEFO Dispensing, Stock Control, Batch & Expiry Tracking, and Suppliers.",
};

export default function PharmacyPage() {
  return <PharmacyWorkspace />;
}
