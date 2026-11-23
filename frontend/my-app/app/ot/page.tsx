import type { Metadata } from "next";
import { OtWorkspace } from "@/components/ot/OtWorkspace";

export const metadata: Metadata = {
  title: "Operation Theatre Management | Healix HMS",
  description:
    "End-to-end Operation Theatre (OT) workflows: Surgery Scheduling, OT Availability, Surgeon Assignment, Pre-operative Checklist, Surgical Records, Anesthesia Records, and Post-operative Monitoring.",
};

export default function OperationTheatrePage() {
  return <OtWorkspace />;
}
