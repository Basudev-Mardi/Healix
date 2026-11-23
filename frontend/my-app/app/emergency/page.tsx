import type { Metadata } from "next";
import { EmergencyWorkspace } from "@/components/emergency/EmergencyWorkspace";

export const metadata: Metadata = {
  title: "Emergency Management | Healix HMS",
  description:
    "End-to-end Emergency Management workflows: Registration, Triage, Priority Queue, Trauma, Treatment Records, Critical Alerts, and Transfers.",
};

export default function EmergencyManagementPage() {
  return <EmergencyWorkspace />;
}
