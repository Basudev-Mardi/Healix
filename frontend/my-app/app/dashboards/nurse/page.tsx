import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Nurse Dashboard | Healix HMS",
  description: "Independent dashboard for Nurse role.",
};

export default function NurseDashboardPage() {
  return (
    <DashboardView
      roleName="Nurse"
      category="Core Role"
      department="Inpatient Nursing & Bedside Care"
      subtitle="Assigned patients, medication administration schedule, vital signs tracking, and shift handovers."
      kpis={[
        {
          label: "Assigned Patients",
          value: "8",
          detail: "General Medical Ward • Wing B",
          tone: "info",
        },
        {
          label: "Medications Due (Next 2h)",
          value: "12",
          detail: "3 IV infusions, 9 oral doses",
          tone: "warning",
        },
        {
          label: "Vitals Logged On Time",
          value: "96%",
          detail: "1 overdue check in Bed B-06",
          tone: "success",
        },
        {
          label: "Active Nurse Call Alerts",
          value: "1",
          detail: "Bed B-03 assistance requested",
          tone: "danger",
        },
      ]}
      sections={[
        {
          title: "Medication Administration Schedule",
          description: "Upcoming MAR tasks for assigned inpatient beds.",
          items: [
            {
              title: "Bed B-02 • Ceftriaxone 1g IV",
              subtitle: "Patient: R. Kulkarni • Verified by Pharmacy",
              meta: "Due 10:30 AM",
              status: "Due Now",
              tone: "warning",
            },
            {
              title: "Bed B-05 • Metoprolol 50mg Oral",
              subtitle: "Patient: H. Patel • Check HR prior to dose",
              meta: "Due 11:00 AM",
              status: "Upcoming",
              tone: "info",
            },
            {
              title: "Bed B-01 • Insulin Glargine 14u SC",
              subtitle: "Patient: E. Morales • Logged",
              meta: "Given 09:00 AM",
              status: "Completed",
              tone: "success",
            },
          ],
        },
        {
          title: "Bedside Vitals & Care Tasks",
          description: "Monitoring observations and nursing shift checklist.",
          items: [
            {
              title: "Bed B-06 • Post-Op Vitals & Dressing",
              subtitle: "Temp 37.9°C • Wound site check required",
              meta: "Overdue 10m",
              status: "Attention",
              tone: "danger",
            },
            {
              title: "Bed B-04 • Fluid Balance Charting",
              subtitle: "Intake/output tally for morning shift",
              meta: "Due 12:00 PM",
              status: "In Progress",
              tone: "info",
            },
            {
              title: "Shift Handover Summary",
              subtitle: "Day-to-Evening SBAR notes draft",
              meta: "Shift ends 03:00 PM",
              status: "Draft",
              tone: "neutral",
            },
          ],
        },
      ]}
    />
  );
}
