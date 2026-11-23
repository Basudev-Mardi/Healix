import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Radiology Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Radiology Staff role.",
};

export default function RadiologyStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Radiology Staff"
      category="Core Role"
      department="Diagnostic Imaging & PACS"
      subtitle="Modality schedules for X-Ray, CT, MRI, and Ultrasound, STAT scans, and radiologist reporting."
      kpis={[
        {
          label: "Scheduled Scans Today",
          value: "94",
          detail: "58 completed, 36 remaining",
          tone: "info",
        },
        {
          label: "STAT Imaging Requests",
          value: "4",
          detail: "2 CT Head, 2 Portable Chest X-Ray",
          tone: "danger",
        },
        {
          label: "Reports Awaiting Sign-Off",
          value: "15",
          detail: "Avg reporting turnaround: 38 mins",
          tone: "warning",
        },
        {
          label: "Modalities Operational",
          value: "6 / 6",
          detail: "MRI 3T, 2 CT, 2 X-Ray, 1 USG",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Modality Worklist",
          description: "Live imaging queue across diagnostic suites.",
          items: [
            {
              title: "CT Suite 1 • Non-Contrast Brain CT",
              subtitle: "Code Stroke protocol • Emergency Bay 2",
              meta: "In Progress",
              status: "STAT",
              tone: "danger",
            },
            {
              title: "MRI 3T • Lumbar Spine w/o Contrast",
              subtitle: "OPD Patient MRN-77412 • Safety screen passed",
              meta: "10:45 AM",
              status: "Prepping",
              tone: "info",
            },
            {
              title: "Portable X-Ray • ICU Bed 07",
              subtitle: "Post-intubation line placement verification",
              meta: "Completed 10:15 AM",
              status: "Uploaded",
              tone: "success",
            },
          ],
        },
        {
          title: "PACS & Reporting Status",
          description: "Study archiving and radiologist interpretation queue.",
          items: [
            {
              title: "Chest CT Angiogram • RAD-5502",
              subtitle: "Preliminary finding flagged for pulmonary embolism",
              meta: "Sent to Doctor",
              status: "Critical Alert",
              tone: "danger",
            },
            {
              title: "Abdominal Ultrasound • RAD-5509",
              subtitle: "Assigned to Dr. N. Verma (Radiology)",
              meta: "Dictating",
              status: "In Review",
              tone: "warning",
            },
            {
              title: "DICOM Archive Sync",
              subtitle: "All morning studies replicated to PACS",
              meta: "100% synced",
              status: "Healthy",
              tone: "success",
            },
          ],
        },
      ]}
    />
  );
}
