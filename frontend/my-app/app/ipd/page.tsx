import type { Metadata } from "next";
import { IpdWorkspace } from "@/components/ipd/IpdWorkspace";

export const metadata: Metadata = {
  title: "IPD Management | Healix HMS",
  description:
    "End-to-end Inpatient Department (IPD) workflows: Admissions, Admission Requests, Discharge Management, Transfers, Daily Progress Notes, Treatment Plans, and Discharge Summaries.",
};

export default function IpdManagementPage() {
  return <IpdWorkspace />;
}
