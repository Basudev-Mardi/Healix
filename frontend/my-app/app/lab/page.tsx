import type { Metadata } from "next";
import { LabWorkspace } from "@/components/lab/LabWorkspace";

export const metadata: Metadata = {
  title: "Laboratory Management (LIS) | Healix HMS",
  description:
    "End-to-end Laboratory Information System covering Test Catalog, Requests, Sample Collection, Tracking, Processing, Verification, and Digital Reports.",
};

export default function LabPage() {
  return <LabWorkspace />;
}
