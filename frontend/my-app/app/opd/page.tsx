import type { Metadata } from "next";
import { OpdWorkspace } from "@/components/opd/OpdWorkspace";

export const metadata: Metadata = {
  title: "OPD Management | Healix HMS",
  description:
    "End-to-end Outpatient Department (OPD) workflows: Patient Registration, Appointments, Walk-ins, Tokens, Queue, Consultation, Follow-ups, and History.",
};

export default function OpdManagementPage() {
  return <OpdWorkspace />;
}
