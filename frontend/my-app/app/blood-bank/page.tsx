import type { Metadata } from "next";
import { BloodBankWorkspace } from "@/components/blood-bank/BloodBankWorkspace";

export const metadata: Metadata = {
  title: "Blood Bank Management | Healix HMS",
  description:
    "End-to-end Blood Bank Management covering Donor Registration, Blood Group & Component Inventory, ABO/Rh Crossmatching, Blood Requests, Transfusions, and Expiry Monitoring.",
};

export default function BloodBankPage() {
  return <BloodBankWorkspace />;
}
