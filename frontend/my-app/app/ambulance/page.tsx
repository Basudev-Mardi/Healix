import type { Metadata } from "next";
import { AmbulanceWorkspace } from "@/components/ambulance/AmbulanceWorkspace";

export const metadata: Metadata = {
  title: "Ambulance Management | Healix HMS",
  description:
    "End-to-end Ambulance Management covering Fleet Registration, Driver Management, Emergency Requests, Real-Time Availability, Dispatch Tracking, and Trip Records.",
};

export default function AmbulancePage() {
  return <AmbulanceWorkspace />;
}
