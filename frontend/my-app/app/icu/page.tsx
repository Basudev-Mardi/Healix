import type { Metadata } from "next";
import { IcuWorkspace } from "@/components/icu/IcuWorkspace";

export const metadata: Metadata = {
  title: "ICU Management | Healix HMS",
  description:
    "End-to-end Intensive Care Unit (ICU) workflows: Admission, Patient Monitoring, Vital Signs, Critical Care Notes, Ventilator Records, Medication Administration, and Transfer/Discharge.",
};

export default function IcuManagementPage() {
  return <IcuWorkspace />;
}
