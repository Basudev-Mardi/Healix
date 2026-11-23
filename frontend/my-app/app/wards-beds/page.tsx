import type { Metadata } from "next";
import { WardBedWorkspace } from "@/components/wards-beds/WardBedWorkspace";

export const metadata: Metadata = {
  title: "Ward & Bed Management | Healix HMS",
  description:
    "End-to-end Ward & Bed Management workflows: Ward Configuration, Bed Availability, Allocation, Transfer, Cleaning Status, Occupancy Tracking, and Isolation Beds.",
};

export default function WardBedManagementPage() {
  return <WardBedWorkspace />;
}
