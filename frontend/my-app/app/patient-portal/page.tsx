import type { Metadata } from "next";
import { PatientPortalWorkspace } from "@/components/patient-portal/PatientPortalWorkspace";

export const metadata: Metadata = {
  title: "Patient Portal | Healix Hospital",
  description:
    "Secure personal patient portal for appointments, live tokens, medical records, prescriptions, lab reports, admissions, billing, insurance, notifications, and support.",
};

export default function PatientPortalPage() {
  return <PatientPortalWorkspace />;
}
