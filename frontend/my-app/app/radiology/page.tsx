import type { Metadata } from "next";
import { RadiologyWorkspace } from "@/components/radiology/RadiologyWorkspace";

export const metadata: Metadata = {
  title: "Radiology Management (RIS) | Healix HMS",
  description:
    "End-to-end Radiology Information System covering X-ray, CT Scan, MRI, Ultrasound, Imaging Appointments, Secure Image Storage, and Radiologist Reports.",
};

export default function RadiologyPage() {
  return <RadiologyWorkspace />;
}
