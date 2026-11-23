import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Medical Records Staff Dashboard | Healix HMS",
  description: "Independent dashboard for Medical Records Staff role.",
};

export default function MedicalRecordsStaffDashboardPage() {
  return (
    <DashboardView
      roleName="Medical Records Staff"
      category="Specialist Role"
      department="Health Information Management (HIM)"
      subtitle="ICD-10 clinical coding, chart completeness audits, release-of-information requests, and archiving."
      kpis={[
        {
          label: "Charts Pending ICD-10 Coding",
          value: "27",
          detail: "19 inpatient discharges, 8 day-surgery",
          tone: "warning",
        },
        {
          label: "Deficient Charts Flagged",
          value: "8",
          detail: "Missing physician signatures or op notes",
          tone: "danger",
        },
        {
          label: "ROI Requests Open",
          value: "13",
          detail: "Patient, legal, and payer record requests",
          tone: "info",
        },
        {
          label: "Digital Archiving Rate",
          value: "99.1%",
          detail: "All scanned consents indexed to EHR",
          tone: "success",
        },
      ]}
      sections={[
        {
          title: "Clinical Coding & Chart Audits",
          description: "Discharged patient charts in coding and documentation review.",
          items: [
            {
              title: "MRN-70412 • Cardiac Surgery Chart",
              subtitle: "DRG & ICD-10-PCS procedure coding in progress",
              meta: "Discharged yesterday",
              status: "Coding",
              tone: "info",
            },
            {
              title: "MRN-70388 • Missing Operative Summary",
              subtitle: "Query sent to Surgical Attending for attestation",
              meta: "48h window",
              status: "Deficient",
              tone: "danger",
            },
            {
              title: "MRN-70355 • General Medicine Chart",
              subtitle: "Audit complete • Released to Billing & Insurance",
              meta: "Completed 09:45",
              status: "Finalized",
              tone: "success",
            },
          ],
        },
        {
          title: "Release of Information (ROI) & Compliance",
          description: "Authorized medical record disclosures and HIPAA access logs.",
          items: [
            {
              title: "ROI-1192 • Patient Portal Record Copy",
              subtitle: "Identity & signed consent verified",
              meta: "Ready to release",
              status: "Approved",
              tone: "success",
            },
            {
              title: "ROI-1198 • Payer Audit Request",
              subtitle: "Requested full ICU progress notes bundle",
              meta: "Due in 2 days",
              status: "Preparing",
              tone: "warning",
            },
            {
              title: "Legacy Paper Chart Digitization",
              subtitle: "Batch #2026-Q4 OCR indexing 85% complete",
              meta: "On schedule",
              status: "Running",
              tone: "info",
            },
          ],
        },
      ]}
    />
  );
}
