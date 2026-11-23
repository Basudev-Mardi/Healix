import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";

export const metadata: Metadata = {
  title: "Doctor Dashboard | Healix HMS",
  description: "Independent dashboard for Doctor role.",
};

export default function DoctorDashboardPage() {
  return (
    <DashboardView
      roleName="Doctor"
      category="Core Role"
      department="Clinical Care & Consultations"
      subtitle="Daily patient rounds, OPD consultations, pending diagnostic reviews, and discharge summaries."
      kpis={[
        {
          label: "OPD Consultations Today",
          value: "22",
          detail: "14 completed, 8 remaining",
          tone: "info",
        },
        {
          label: "Assigned Inpatients",
          value: "11",
          detail: "Morning rounds completed for 9",
          tone: "success",
        },
        {
          label: "Lab & Imaging Results",
          value: "7",
          detail: "2 flagged as critical review",
          tone: "danger",
        },
        {
          label: "Pending Discharge Notes",
          value: "3",
          detail: "Scheduled before 4:00 PM",
          tone: "warning",
        },
      ]}
      sections={[
        {
          title: "Next Patient Consultations",
          description: "Active outpatient schedule and visit priority.",
          items: [
            {
              title: "MRN-88210 • Vikram Rao (54M)",
              subtitle: "Post-angioplasty follow-up • ECG attached",
              meta: "Room 204 • 10:30 AM",
              status: "Ready",
              tone: "success",
            },
            {
              title: "MRN-88342 • Claire Evans (37F)",
              subtitle: "Persistent migraine evaluation",
              meta: "Room 204 • 10:50 AM",
              status: "Waiting",
              tone: "info",
            },
            {
              title: "MRN-88409 • Mateo Silva (62M)",
              subtitle: "Hypertension medication titration",
              meta: "Room 204 • 11:15 AM",
              status: "Scheduled",
              tone: "neutral",
            },
          ],
        },
        {
          title: "Clinical Results & Orders",
          description: "Recent diagnostic findings requiring physician sign-off.",
          items: [
            {
              title: "Troponin I Elevation • Bed 4B-12",
              subtitle: "Stat biochemistry result from Central Lab",
              meta: "Received 8m ago",
              status: "Critical",
              tone: "danger",
            },
            {
              title: "Chest CT Angiogram • Bed 3A-04",
              subtitle: "Radiology preliminary report uploaded",
              meta: "Received 25m ago",
              status: "Review",
              tone: "warning",
            },
            {
              title: "HbA1c & Lipid Panel • MRN-88210",
              subtitle: "Routine outpatient lab panel",
              meta: "Received 1h ago",
              status: "Normal",
              tone: "success",
            },
          ],
        },
      ]}
    />
  );
}
